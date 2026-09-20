package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ceylon.intellibiz.config.SecurityConfig;
import com.ceylon.intellibiz.model.User;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.security.JwtAuthenticationFilter;
import com.ceylon.intellibiz.security.JwtService;
import com.ceylon.intellibiz.security.RestAuthenticationEntryPoint;
import com.ceylon.intellibiz.support.FakeUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/** Registration, login and /me behind the real security rules, JWT filter and password encoder. */
@WebMvcTest(controllers = AuthController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    RestAuthenticationEntryPoint.class,
    AuthControllerTest.Fakes.class
})
class AuthControllerTest {

    static final FakeUsers FAKE = new FakeUsers();

    @TestConfiguration
    static class Fakes {
        @Bean
        UserRepository userRepository() {
            return FAKE.repository();
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void reset() {
        FAKE.users.clear();
    }

    private MvcResult register(String json, int expectedStatus) throws Exception {
        return mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().is(expectedStatus))
            .andReturn();
    }

    private static String registerBody(String username, String email, String password, String extra) {
        return "{\"username\":\"" + username + "\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"" + extra + "}";
    }

    @Test
    void newAccountsAreAlwaysStaffEvenWhenACallerAsksForAHigherRole() throws Exception {
        for (String requested : new String[] {"ADMIN", "admin", "Finance", "SALES", "ROLE_ADMIN", ""}) {
            FAKE.users.clear();
            MvcResult result = register(registerBody("asha", "asha@company.lk", "correct-horse", ",\"role\":\"" + requested + "\""), 200);

            assertEquals("STAFF", FAKE.users.get(0).getRole(), "stored role for requested '" + requested + "'");
            assertTrue(result.getResponse().getContentAsString().contains("\"role\":\"STAFF\""), "response role for '" + requested + "'");

            String token = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(result.getResponse().getContentAsString()).get("token").asText();
            assertEquals("STAFF", jwtService.parseClaims(token).get("role", String.class), "token role for '" + requested + "'");
        }
    }

    @Test
    void registrationWithoutARoleStillWorks() throws Exception {
        register(registerBody("kamal", "kamal@company.lk", "correct-horse", ""), 200);
        assertEquals("STAFF", FAKE.users.get(0).getRole());
    }

    @Test
    void passwordsAreStoredHashed() throws Exception {
        register(registerBody("nimal", "nimal@company.lk", "correct-horse", ""), 200);
        String stored = FAKE.users.get(0).getPasswordHash();
        assertTrue(!stored.equals("correct-horse") && passwordEncoder.matches("correct-horse", stored));
    }

    @Test
    void duplicateUsernamesAndEmailsAreRejected() throws Exception {
        register(registerBody("asha", "asha@company.lk", "correct-horse", ""), 200);
        register(registerBody("asha", "other@company.lk", "correct-horse", ""), 409);
        register(registerBody("other", "asha@company.lk", "correct-horse", ""), 409);
        assertEquals(1, FAKE.users.size());
    }

    @Test
    void weakOrMalformedRegistrationsAreRejected() throws Exception {
        register(registerBody("asha", "asha@company.lk", "short", ""), 400);
        register(registerBody("asha", "not-an-email", "correct-horse", ""), 400);
        register(registerBody("as", "asha@company.lk", "correct-horse", ""), 400);
        assertTrue(FAKE.users.isEmpty());
    }

    @Test
    void loginReturnsTheStoredRoleAndRejectsBadCredentials() throws Exception {
        User admin = FAKE.add("owner", "ADMIN");
        admin.setEmail("owner@company.lk");
        admin.setPasswordHash(passwordEncoder.encode("correct-horse"));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"usernameOrEmail\":\"owner@company.lk\",\"password\":\"correct-horse\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"usernameOrEmail\":\"owner\",\"password\":\"wrong-password\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void meReturnsTheCurrentStoredRoleNotTheOneInTheToken() throws Exception {
        User user = FAKE.add("asha", "STAFF");
        String header = FAKE.bearerFor(jwtService, user);

        mockMvc.perform(get("/api/auth/me").header("Authorization", header))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("asha"))
            .andExpect(jsonPath("$.role").value("STAFF"))
            .andExpect(jsonPath("$.token").doesNotExist());

        user.setRole("SALES");

        mockMvc.perform(get("/api/auth/me").header("Authorization", header))
            .andExpect(jsonPath("$.role").value("SALES"));
    }

    @Test
    void meNeedsAValidTokenForAUserThatStillExists() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer garbage")).andExpect(status().isUnauthorized());

        User user = FAKE.add("asha", "SALES");
        String header = FAKE.bearerFor(jwtService, user);
        FAKE.users.clear();
        mockMvc.perform(get("/api/auth/me").header("Authorization", header)).andExpect(status().isUnauthorized());
    }
}
