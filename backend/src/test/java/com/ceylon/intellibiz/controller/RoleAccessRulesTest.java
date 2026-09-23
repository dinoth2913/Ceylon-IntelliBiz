package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ceylon.intellibiz.config.SecurityConfig;
import com.ceylon.intellibiz.model.User;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.security.JwtAuthenticationFilter;
import com.ceylon.intellibiz.security.RateLimitFilter;
import com.ceylon.intellibiz.security.RateLimiter;
import com.ceylon.intellibiz.security.JwtService;
import com.ceylon.intellibiz.security.RestAuthenticationEntryPoint;
import com.ceylon.intellibiz.support.FakeUsers;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Checks the whole access matrix in SecurityConfig without any real controllers: a probe answers 200 to
 * every /api request, so the only thing that can produce 401 or 403 is the security rules themselves.
 */
@WebMvcTest(controllers = RoleAccessRulesTest.Probe.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    RateLimitFilter.class,
    RateLimiter.class,
    JwtService.class,
    RestAuthenticationEntryPoint.class,
    RoleAccessRulesTest.Probe.class,
    RoleAccessRulesTest.Fakes.class
})
class RoleAccessRulesTest {

    static final FakeUsers FAKE = new FakeUsers();

    @RestController
    static class Probe {
        @RequestMapping("/api/**")
        String any() {
            return "ok";
        }
    }

    @TestConfiguration
    static class Fakes {
        @Bean
        UserRepository userRepository() {
            return FAKE.repository();
        }
    }

    private static final Set<String> ALL = Set.of("ADMIN", "SALES", "FINANCE", "STAFF");
    private static final Set<String> BUSINESS = Set.of("ADMIN", "SALES", "FINANCE");
    private static final Set<String> SALES_SIDE = Set.of("ADMIN", "SALES");
    private static final Set<String> FINANCE_SIDE = Set.of("ADMIN", "FINANCE");
    private static final Set<String> ADMIN_ONLY = Set.of("ADMIN");

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;

    private final List<String> problems = new ArrayList<>();

    @BeforeEach
    void reset() {
        FAKE.users.clear();
        problems.clear();
    }

    /** Expects the listed roles to get 200, every other signed-in role 403, and anonymous callers 401 (or 200 if public). */
    private void rule(HttpMethod method, String path, Set<String> allowedRoles, boolean publicAccess) throws Exception {
        int anonymous = mockMvc.perform(request(method, path)).andReturn().getResponse().getStatus();
        int expectedAnonymous = publicAccess ? 200 : 401;
        if (anonymous != expectedAnonymous) {
            problems.add(method + " " + path + " as anonymous: expected " + expectedAnonymous + " but was " + anonymous);
        }
        for (String role : ALL) {
            int actual = mockMvc.perform(request(method, path).header("Authorization", FAKE.bearer(jwtService, role)))
                .andReturn().getResponse().getStatus();
            int expected = allowedRoles.contains(role) ? 200 : 403;
            if (actual != expected) {
                problems.add(method + " " + path + " as " + role + ": expected " + expected + " but was " + actual);
            }
        }
    }

    private void publicRule(HttpMethod method, String path) throws Exception {
        rule(method, path, ALL, true);
    }

    private void areaRule(String path, Set<String> writers) throws Exception {
        rule(HttpMethod.GET, path, BUSINESS, false);
        rule(HttpMethod.GET, path + "/5", BUSINESS, false);
        rule(HttpMethod.POST, path, writers, false);
        rule(HttpMethod.PUT, path + "/5", writers, false);
        rule(HttpMethod.DELETE, path + "/5", writers, false);
    }

    @Test
    void everyEndpointEnforcesItsRoles() throws Exception {
        // Public
        publicRule(HttpMethod.GET, "/api/health");
        publicRule(HttpMethod.POST, "/api/auth/login");
        publicRule(HttpMethod.POST, "/api/auth/register");
        publicRule(HttpMethod.GET, "/api/products");
        publicRule(HttpMethod.GET, "/api/products/search");
        publicRule(HttpMethod.GET, "/api/products/category/spices");
        publicRule(HttpMethod.GET, "/api/reviews/abc");
        publicRule(HttpMethod.POST, "/api/chat");
        publicRule(HttpMethod.GET, "/api/chat/session-1");
        publicRule(HttpMethod.POST, "/api/contact-requests");
        publicRule(HttpMethod.POST, "/api/marketplace-orders");

        // Any signed-in user
        rule(HttpMethod.GET, "/api/auth/me", ALL, false);
        rule(HttpMethod.POST, "/api/reviews", ALL, false);

        // Marketplace catalogue is only written by sales and admins
        rule(HttpMethod.POST, "/api/products", SALES_SIDE, false);
        rule(HttpMethod.PUT, "/api/products/abc", SALES_SIDE, false);
        rule(HttpMethod.DELETE, "/api/products/abc", SALES_SIDE, false);

        // Demo requests can be read by sales and admins
        rule(HttpMethod.GET, "/api/contact-requests", SALES_SIDE, false);

        // Marketplace purchase requests can only be read by sales and admins
        rule(HttpMethod.GET, "/api/marketplace-orders", SALES_SIDE, false);

        // Business data: everyone with a business role reads, the owning role writes
        areaRule("/api/customers", SALES_SIDE);
        areaRule("/api/orders", SALES_SIDE);
        areaRule("/api/inventory", SALES_SIDE);
        areaRule("/api/vendors", SALES_SIDE);
        areaRule("/api/invoices", FINANCE_SIDE);

        // AI insights
        rule(HttpMethod.GET, "/api/ai/insights", BUSINESS, false);

        // Admin only
        rule(HttpMethod.GET, "/api/users", ADMIN_ONLY, false);
        rule(HttpMethod.PUT, "/api/users/1/role", ADMIN_ONLY, false);
        rule(HttpMethod.POST, "/api/users/1/reset-password", ADMIN_ONLY, false);
        rule(HttpMethod.GET, "/api/db-test", ADMIN_ONLY, false);

        // Deny by default: an endpoint nobody has written a rule for is admin-only, never open
        rule(HttpMethod.GET, "/api/brand-new-endpoint", ADMIN_ONLY, false);
        rule(HttpMethod.POST, "/api/brand-new-endpoint", ADMIN_ONLY, false);

        assertTrue(problems.isEmpty(), "Access rules do not match the matrix:\n" + String.join("\n", problems));
    }

    @Test
    void aChangedRoleTakesEffectOnTheVeryNextRequest() throws Exception {
        User user = FAKE.add("asha", "SALES");
        String header = FAKE.bearerFor(jwtService, user);

        assertEquals(200, mockMvc.perform(request(HttpMethod.POST, "/api/customers").header("Authorization", header)).andReturn().getResponse().getStatus());

        user.setRole("FINANCE");
        assertEquals(403, mockMvc.perform(request(HttpMethod.POST, "/api/customers").header("Authorization", header)).andReturn().getResponse().getStatus());
        assertEquals(200, mockMvc.perform(request(HttpMethod.POST, "/api/invoices").header("Authorization", header)).andReturn().getResponse().getStatus());

        user.setRole("STAFF");
        mockMvc.perform(request(HttpMethod.GET, "/api/customers").header("Authorization", header)).andExpect(status().isForbidden());
    }

    @Test
    void aDeletedUsersTokenStopsWorkingImmediately() throws Exception {
        User user = FAKE.add("asha", "ADMIN");
        String header = FAKE.bearerFor(jwtService, user);
        mockMvc.perform(request(HttpMethod.GET, "/api/users").header("Authorization", header)).andExpect(status().isOk());

        FAKE.users.clear();

        mockMvc.perform(request(HttpMethod.GET, "/api/users").header("Authorization", header)).andExpect(status().isUnauthorized());
    }

    @Test
    void roleNamesInTheDatabaseAreMatchedCaseInsensitively() throws Exception {
        User user = FAKE.add("asha", "sales");
        mockMvc.perform(request(HttpMethod.GET, "/api/customers").header("Authorization", FAKE.bearerFor(jwtService, user)))
            .andExpect(status().isOk());
    }

    @Test
    void forgedOrTamperedTokensAreRejected() throws Exception {
        String valid = FAKE.bearer(jwtService, "ADMIN");
        String tampered = valid.substring(0, valid.length() - 3) + (valid.endsWith("AAA") ? "BBB" : "AAA");
        for (String header : new String[] {tampered, "Bearer not.a.jwt", "Basic YWRtaW46YWRtaW4="}) {
            mockMvc.perform(request(HttpMethod.GET, "/api/users").header("Authorization", header)).andExpect(status().isUnauthorized());
        }
    }
}
