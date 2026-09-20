package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.test.web.servlet.MockMvc;

/** Team management behind the real security rules: only admins can list users or change roles. */
@WebMvcTest(controllers = UserAdminController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    RestAuthenticationEntryPoint.class,
    UserAdminControllerTest.Fakes.class
})
class UserAdminControllerTest {

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

    private User admin;

    @BeforeEach
    void reset() {
        FAKE.users.clear();
        admin = FAKE.add("owner", "ADMIN");
    }

    private String adminHeader() {
        return FAKE.bearerFor(jwtService, admin);
    }

    private void setRole(String userId, String role, String header, int expectedStatus) throws Exception {
        mockMvc.perform(put("/api/users/" + userId + "/role")
                .header("Authorization", header)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"" + role + "\"}"))
            .andExpect(status().is(expectedStatus));
    }

    @Test
    void adminsSeeEveryoneButNeverPasswordHashes() throws Exception {
        FAKE.add("asha", "SALES");

        mockMvc.perform(get("/api/users").header("Authorization", adminHeader()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].username").value("owner"))
            .andExpect(jsonPath("$[1].username").value("asha"))
            .andExpect(jsonPath("$[1].role").value("SALES"))
            .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
            .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void nobodyButAnAdminCanListUsers() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
        for (String role : new String[] {"SALES", "FINANCE", "STAFF"}) {
            mockMvc.perform(get("/api/users").header("Authorization", FAKE.bearer(jwtService, role))).andExpect(status().isForbidden());
        }
    }

    @Test
    void anAdminCanAssignRoles() throws Exception {
        User asha = FAKE.add("asha", "STAFF");

        mockMvc.perform(put("/api/users/" + asha.getId() + "/role")
                .header("Authorization", adminHeader())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"finance\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("FINANCE"))
            .andExpect(jsonPath("$.username").value("asha"));

        assertEquals("FINANCE", asha.getRole());
    }

    @Test
    void aNewlyPromotedUserGainsAccessImmediately() throws Exception {
        User asha = FAKE.add("asha", "STAFF");
        String ashaHeader = FAKE.bearerFor(jwtService, asha);
        mockMvc.perform(get("/api/users").header("Authorization", ashaHeader)).andExpect(status().isForbidden());

        setRole(asha.getId(), "ADMIN", adminHeader(), 200);

        mockMvc.perform(get("/api/users").header("Authorization", ashaHeader)).andExpect(status().isOk());
    }

    @Test
    void nonAdminsCannotChangeRolesEvenTheirOwn() throws Exception {
        User asha = FAKE.add("asha", "SALES");
        String ashaHeader = FAKE.bearerFor(jwtService, asha);

        setRole(asha.getId(), "ADMIN", ashaHeader, 403);
        setRole(asha.getId(), "ADMIN", "Bearer garbage", 401);

        assertEquals("SALES", asha.getRole());
    }

    @Test
    void unknownRolesAndUsersAreRejected() throws Exception {
        User asha = FAKE.add("asha", "STAFF");

        setRole(asha.getId(), "OWNER", adminHeader(), 400);
        setRole(asha.getId(), "ROLE_ADMIN", adminHeader(), 400);
        setRole(asha.getId(), "", adminHeader(), 400);
        setRole("no-such-user", "SALES", adminHeader(), 404);

        assertEquals("STAFF", asha.getRole());
    }

    @Test
    void theLastAdminCannotBeDemoted() throws Exception {
        setRole(admin.getId(), "STAFF", adminHeader(), 409);
        setRole(admin.getId(), "SALES", adminHeader(), 409);

        assertEquals("ADMIN", admin.getRole());
    }

    @Test
    void anAdminCanStepDownOnceAnotherAdminExists() throws Exception {
        User second = FAKE.add("second", "ADMIN");

        setRole(admin.getId(), "SALES", adminHeader(), 200);
        assertEquals("SALES", admin.getRole());

        // second is now the only admin and is protected
        setRole(second.getId(), "STAFF", FAKE.bearerFor(jwtService, second), 409);
        assertEquals("ADMIN", second.getRole());
    }

    @Test
    void reassigningTheSameAdminRoleIsHarmless() throws Exception {
        setRole(admin.getId(), "ADMIN", adminHeader(), 200);
        assertEquals("ADMIN", admin.getRole());
    }
}
