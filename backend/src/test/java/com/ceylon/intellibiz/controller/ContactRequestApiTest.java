package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ceylon.intellibiz.config.SecurityConfig;
import com.ceylon.intellibiz.model.ContactRequest;
import com.ceylon.intellibiz.repository.ContactRequestRepository;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.support.FakeUsers;
import com.ceylon.intellibiz.security.JwtAuthenticationFilter;
import com.ceylon.intellibiz.security.RateLimitFilter;
import com.ceylon.intellibiz.security.RateLimiter;
import com.ceylon.intellibiz.security.JwtService;
import com.ceylon.intellibiz.security.RestAuthenticationEntryPoint;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Exercises the demo-request endpoints behind the real security rules and JWT filter. */
@WebMvcTest(controllers = ContactRequestController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    RateLimitFilter.class,
    RateLimiter.class,
    JwtService.class,
    RestAuthenticationEntryPoint.class,
    ContactRequestApiTest.Fakes.class
})
class ContactRequestApiTest {

    static final List<ContactRequest> STORE = new ArrayList<>();
    static final FakeUsers FAKE_USERS = new FakeUsers();

    @TestConfiguration
    static class Fakes {
        @Bean
        UserRepository userRepository() {
            return FAKE_USERS.repository();
        }

        @Bean
        ContactRequestRepository contactRequestRepository() {
            return (ContactRequestRepository) Proxy.newProxyInstance(
                ContactRequestApiTest.class.getClassLoader(),
                new Class<?>[] {ContactRequestRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "save" -> {
                        ContactRequest saved = (ContactRequest) args[0];
                        saved.setId(String.valueOf(STORE.size() + 1));
                        STORE.add(saved);
                        yield saved;
                    }
                    case "findAllByOrderByCreatedAtDesc" -> {
                        List<ContactRequest> newestFirst = new ArrayList<>(STORE);
                        Collections.reverse(newestFirst);
                        yield newestFirst;
                    }
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    case "toString" -> "FakeContactRequestRepository";
                    default -> throw new UnsupportedOperationException(method.getName());
                });
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;

    @BeforeEach
    void reset() {
        STORE.clear();
        FAKE_USERS.users.clear();
    }

    private static String body(String name, String email, String company, String message, String website) {
        return "{\"name\":" + quote(name) + ",\"email\":" + quote(email) + ",\"company\":" + quote(company)
            + ",\"message\":" + quote(message) + ",\"website\":" + quote(website) + "}";
    }

    private static String quote(String value) {
        return value == null ? "null" : "\"" + value.replace("\"", "\\\"") + "\"";
    }

    private String bearer(String role) {
        return FAKE_USERS.bearer(jwtService, role);
    }

    private void submit(String json, int expectedStatus) throws Exception {
        mockMvc.perform(post("/api/contact-requests").contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().is(expectedStatus));
    }

    @Test
    void anonymousVisitorsCanSubmitADemoRequest() throws Exception {
        submit(body("  Asha Perera ", "asha@company.lk", "Ceylon Traders", "  Need a stock module  ", ""), 201);

        assertEquals(1, STORE.size());
        ContactRequest saved = STORE.get(0);
        assertEquals("Asha Perera", saved.getName());
        assertEquals("asha@company.lk", saved.getEmail());
        assertEquals("Need a stock module", saved.getMessage());
        assertEquals("New", saved.getStatus());
    }

    @Test
    void theMessageIsOptional() throws Exception {
        submit(body("Asha", "asha@company.lk", "Ceylon Traders", null, null), 201);
        assertNull(STORE.get(0).getMessage());
    }

    @Test
    void honeypotSubmissionsLookSuccessfulButAreDropped() throws Exception {
        submit(body("Bot", "bot@spam.com", "Spam Inc", "buy now", "http://spam.example"), 201);
        assertTrue(STORE.isEmpty());
    }

    @Test
    void invalidSubmissionsAreRejectedAndNotStored() throws Exception {
        submit(body("", "asha@company.lk", "Ceylon Traders", "hi", null), 400);
        submit(body("Asha", "not-an-email", "Ceylon Traders", "hi", null), 400);
        submit(body("Asha", "asha@company.lk", "   ", "hi", null), 400);
        submit(body("Asha", "asha@company.lk", "Ceylon Traders", "x".repeat(2001), null), 400);
        submit(body("n".repeat(256), "asha@company.lk", "Ceylon Traders", "hi", null), 400);
        assertTrue(STORE.isEmpty());
    }

    @Test
    void readingRequestsNeedsASignedInUser() throws Exception {
        mockMvc.perform(get("/api/contact-requests")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/contact-requests").header("Authorization", "Bearer not-a-real-token"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void onlySalesAndAdminsMayReadRequests() throws Exception {
        for (String role : new String[] {"FINANCE", "STAFF"}) {
            mockMvc.perform(get("/api/contact-requests").header("Authorization", bearer(role)))
                .andExpect(status().isForbidden());
        }
        for (String role : new String[] {"SALES", "ADMIN"}) {
            mockMvc.perform(get("/api/contact-requests").header("Authorization", bearer(role)))
                .andExpect(status().isOk());
        }
    }

    @Test
    void signedInUsersSeeRequestsNewestFirst() throws Exception {
        submit(body("First", "first@company.lk", "A Co", "one", null), 201);
        submit(body("Second", "second@company.lk", "B Co", "two", null), 201);

        mockMvc.perform(get("/api/contact-requests").header("Authorization", bearer("SALES")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].name").value("Second"))
            .andExpect(jsonPath("$[1].name").value("First"))
            .andExpect(jsonPath("$[0].status").value("New"));
    }
}
