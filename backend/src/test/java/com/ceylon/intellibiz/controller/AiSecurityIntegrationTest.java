package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ceylon.intellibiz.config.SecurityConfig;
import com.ceylon.intellibiz.dto.AiChatReply;
import com.ceylon.intellibiz.dto.AiInsight;
import com.ceylon.intellibiz.repository.ChatMessageRepository;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.support.FakeUsers;
import com.ceylon.intellibiz.security.JwtAuthenticationFilter;
import com.ceylon.intellibiz.security.JwtService;
import com.ceylon.intellibiz.security.RestAuthenticationEntryPoint;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Runs the real security rules and JWT filter in front of the AI-backed endpoints. */
@WebMvcTest(controllers = {ChatController.class, AiController.class})
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    RestAuthenticationEntryPoint.class,
    AiSecurityIntegrationTest.Fakes.class
})
class AiSecurityIntegrationTest {

    static final FakeUsers FAKE_USERS = new FakeUsers();

    @TestConfiguration
    static class Fakes {
        @Bean
        UserRepository userRepository() {
            return FAKE_USERS.repository();
        }

        @Bean
        ChatMessageRepository chatMessageRepository() {
            return ChatControllerTest.fakeRepository(new ArrayList<>());
        }

        @Bean
        ChatControllerTest.FakeAiClient aiServiceClient() {
            return new ChatControllerTest.FakeAiClient();
        }

        @Bean
        ChatControllerTest.FakeContextService businessContextService() {
            return new ChatControllerTest.FakeContextService();
        }
    }

    private static final String CHAT_BODY = "{\"sessionId\":\"s1\",\"content\":\"summarise sales\"}";

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired ChatControllerTest.FakeAiClient ai;
    @Autowired ChatControllerTest.FakeContextService contextService;

    @BeforeEach
    void reset() {
        ai.reply = Optional.of(new AiChatReply("You have 6 orders", "sales", List.of("Any overdue invoices?")));
        ai.insights = Optional.empty();
        ai.lastContext = null;
        ai.calls = 0;
        contextService.builds = 0;
        FAKE_USERS.users.clear();
    }

    private String bearer(String role) {
        return FAKE_USERS.bearer(jwtService, role);
    }

    @Test
    void anonymousVisitorsCanChatButNeverReceiveWorkspaceData() throws Exception {
        mockMvc.perform(post("/api/chat").contentType(MediaType.APPLICATION_JSON).content(CHAT_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aiMessage.content").value("You have 6 orders"))
            .andExpect(jsonPath("$.aiMessage.role").value("assistant"))
            .andExpect(jsonPath("$.intent").value("sales"))
            .andExpect(jsonPath("$.suggestions[0]").value("Any overdue invoices?"));

        assertEquals(1, ai.calls);
        assertNull(ai.lastContext);
        assertEquals(0, contextService.builds);
    }

    @Test
    void anInvalidTokenOnTheChatEndpointIsTreatedAsAnonymous() throws Exception {
        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer not-a-real-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(CHAT_BODY))
            .andExpect(status().isOk());

        assertNull(ai.lastContext);
        assertEquals(0, contextService.builds);
    }

    @Test
    void signedInUsersGetAnswersGroundedInTheirWorkspace() throws Exception {
        mockMvc.perform(post("/api/chat")
                .header("Authorization", bearer("SALES"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(CHAT_BODY))
            .andExpect(status().isOk());

        assertEquals(ChatControllerTest.WORKSPACE, ai.lastContext);
        assertEquals(1, contextService.builds);
    }

    @Test
    void everyBusinessRoleGetsWorkspaceAnswers() throws Exception {
        for (String role : new String[] {"ADMIN", "SALES", "FINANCE"}) {
            ai.lastContext = null;
            mockMvc.perform(post("/api/chat")
                    .header("Authorization", bearer(role))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(CHAT_BODY))
                .andExpect(status().isOk());
            assertEquals(ChatControllerTest.WORKSPACE, ai.lastContext, role);
        }
    }

    @Test
    void signedInUsersWithoutABusinessRoleNeverReceiveWorkspaceData() throws Exception {
        mockMvc.perform(post("/api/chat")
                .header("Authorization", bearer("STAFF"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(CHAT_BODY))
            .andExpect(status().isOk());

        assertNull(ai.lastContext);
        assertEquals(0, contextService.builds);
    }

    @Test
    void emptyMessagesAreRejected() throws Exception {
        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sessionId\":\"s1\",\"content\":\"   \"}"))
            .andExpect(status().isBadRequest());
        assertEquals(0, ai.calls);
    }

    @Test
    void insightsRequireASignedInUser() throws Exception {
        mockMvc.perform(get("/api/ai/insights")).andExpect(status().isUnauthorized());
        assertEquals(0, contextService.builds);
    }

    @Test
    void insightsAreReturnedToSignedInUsers() throws Exception {
        ai.insights = Optional.of(List.of(new AiInsight("AI-1", "Reorder pallets", "8 left", 100, "Risk")));

        mockMvc.perform(get("/api/ai/insights").header("Authorization", bearer("FINANCE")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("AI-1"))
            .andExpect(jsonPath("$[0].category").value("Risk"))
            .andExpect(jsonPath("$[0].confidence").value(100));
    }

    @Test
    void insightsReportServiceUnavailableWhenTheAiServiceIsDown() throws Exception {
        mockMvc.perform(get("/api/ai/insights").header("Authorization", bearer("ADMIN")))
            .andExpect(status().isServiceUnavailable());
    }

    @Test
    void insightsAreForbiddenToUsersWithoutABusinessRole() throws Exception {
        mockMvc.perform(get("/api/ai/insights").header("Authorization", bearer("STAFF")))
            .andExpect(status().isForbidden());
        assertEquals(0, contextService.builds);
    }
}
