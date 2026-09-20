package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ceylon.intellibiz.dto.AiBusinessContext;
import com.ceylon.intellibiz.dto.AiChatReply;
import com.ceylon.intellibiz.dto.AiInsight;
import com.ceylon.intellibiz.model.ChatMessage;
import com.ceylon.intellibiz.repository.ChatMessageRepository;
import com.ceylon.intellibiz.service.AiServiceClient;
import com.ceylon.intellibiz.service.BusinessContextService;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class ChatControllerTest {

    static final AiBusinessContext WORKSPACE = new AiBusinessContext(
        1,
        new AiBusinessContext.Orders(0, 0, 0, 0, 0, 0, 0),
        new AiBusinessContext.Invoices(0, 0, 0, 0, 0, 0, 0, 0, 0),
        new AiBusinessContext.Inventory(0, List.of()));

    static class FakeAiClient extends AiServiceClient {
        Optional<AiChatReply> reply = Optional.empty();
        Optional<List<AiInsight>> insights = Optional.empty();
        String lastMessage;
        AiBusinessContext lastContext;
        int calls;

        FakeAiClient() {
            super(RestClient.create());
        }

        @Override
        public Optional<AiChatReply> chat(String message, String sessionId, AiBusinessContext context) {
            calls++;
            lastMessage = message;
            lastContext = context;
            return reply;
        }

        @Override
        public Optional<List<AiInsight>> insights(AiBusinessContext context) {
            lastContext = context;
            return insights;
        }
    }

    static class FakeContextService extends BusinessContextService {
        int builds;

        FakeContextService() {
            super(null, null, null, null);
        }

        @Override
        public AiBusinessContext build() {
            builds++;
            return WORKSPACE;
        }
    }

    /** In-memory stand-in for the Mongo repository that only supports save(). */
    static ChatMessageRepository fakeRepository(List<ChatMessage> saved) {
        return (ChatMessageRepository) Proxy.newProxyInstance(
            ChatControllerTest.class.getClassLoader(),
            new Class<?>[] {ChatMessageRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    saved.add((ChatMessage) args[0]);
                    yield args[0];
                }
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeChatMessageRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<ChatMessage> saved = new ArrayList<>();
    private FakeAiClient ai;
    private FakeContextService contextService;
    private ChatController controller;

    @BeforeEach
    void setUp() {
        ai = new FakeAiClient();
        contextService = new FakeContextService();
        controller = new ChatController(fakeRepository(saved), ai, contextService);
    }

    private static ChatMessage message(String content) {
        ChatMessage message = new ChatMessage();
        message.setSessionId("session-1");
        message.setContent(content);
        return message;
    }

    private static Authentication signedIn() {
        return signedInAs("ROLE_SALES");
    }

    private static Authentication signedInAs(String authority) {
        return new UsernamePasswordAuthenticationToken("asha", null, List.of(new SimpleGrantedAuthority(authority)));
    }

    @Test
    void anonymousCallersNeverGetWorkspaceData() {
        ai.reply = Optional.of(new AiChatReply("Sign in for live numbers", "sales", List.of()));

        controller.sendMessage(message("summarise sales"), null);

        assertNull(ai.lastContext);
        assertEquals(0, contextService.builds);
    }

    @Test
    void signedInCallersGetWorkspaceContext() {
        ai.reply = Optional.of(new AiChatReply("You have 0 orders", "sales", List.of("Next?")));

        Map<String, Object> result = controller.sendMessage(message("summarise sales"), signedIn());

        assertEquals(WORKSPACE, ai.lastContext);
        assertEquals(1, contextService.builds);
        assertEquals("sales", result.get("intent"));
        assertEquals(List.of("Next?"), result.get("suggestions"));
        assertEquals("You have 0 orders", ((ChatMessage) result.get("aiMessage")).getContent());
    }

    @Test
    void signedInUsersWithoutABusinessRoleGetTheGeneralAnswer() {
        ai.reply = Optional.of(new AiChatReply("General answer", "sales", List.of()));

        controller.sendMessage(message("summarise sales"), signedInAs("ROLE_STAFF"));

        assertNull(ai.lastContext);
        assertEquals(0, contextService.builds);
    }

    @Test
    void storesBothSidesOfTheConversationInTheSameSession() {
        ai.reply = Optional.of(new AiChatReply("Hi there", "greeting", List.of()));

        controller.sendMessage(message("  hello  "), null);

        assertEquals(2, saved.size());
        assertEquals("user", saved.get(0).getRole());
        assertEquals("hello", saved.get(0).getContent());
        assertEquals("assistant", saved.get(1).getRole());
        assertEquals("session-1", saved.get(1).getSessionId());
        assertNotNull(saved.get(1).getCreatedAt());
    }

    @Test
    void fallsBackToBuiltInAnswersWhenTheAiServiceIsDown() {
        ai.reply = Optional.empty();

        Map<String, Object> result = controller.sendMessage(message("tell me about your CRM"), null);

        ChatMessage answer = (ChatMessage) result.get("aiMessage");
        assertTrue(answer.getContent().contains("CRM"));
        assertEquals("fallback", result.get("intent"));
        assertEquals(List.of(), result.get("suggestions"));
        assertEquals(2, saved.size());
    }

    @Test
    void rejectsBlankAndOversizedMessagesWithoutSavingAnything() {
        for (String content : new String[] {null, "", "   ", "x".repeat(ChatController.MAX_MESSAGE_LENGTH + 1)}) {
            ResponseStatusException error =
                assertThrows(ResponseStatusException.class, () -> controller.sendMessage(message(content), null));
            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }
        assertTrue(saved.isEmpty());
        assertEquals(0, ai.calls);
    }

    @Test
    void ignoresAClientSuppliedMessageId() {
        ai.reply = Optional.of(new AiChatReply("ok", "help", List.of()));
        ChatMessage incoming = message("help");
        incoming.setId("someone-elses-message");

        controller.sendMessage(incoming, null);

        assertNull(saved.get(0).getId());
    }
}
