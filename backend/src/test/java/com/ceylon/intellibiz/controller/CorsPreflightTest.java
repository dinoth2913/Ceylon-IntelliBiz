package com.ceylon.intellibiz.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ceylon.intellibiz.config.CorsConfig;
import com.ceylon.intellibiz.config.SecurityConfig;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.security.JwtAuthenticationFilter;
import com.ceylon.intellibiz.security.JwtService;
import com.ceylon.intellibiz.security.RestAuthenticationEntryPoint;
import com.ceylon.intellibiz.support.FakeUsers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.test.web.servlet.MockMvc;

/**
 * A browser sends an unauthenticated OPTIONS "preflight" before any request that carries an Authorization header.
 * If Spring Security answers it with 401 the frontend cannot talk to the API at all.
 */
@WebMvcTest(controllers = CorsPreflightTest.Probe.class)
@Import({
    SecurityConfig.class,
    CorsConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    RestAuthenticationEntryPoint.class,
    CorsPreflightTest.Probe.class,
    CorsPreflightTest.Fakes.class
})
class CorsPreflightTest {

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
            return new FakeUsers().repository();
        }
    }

    private static final String ALLOWED_ORIGIN = "http://localhost:3000";

    @Autowired MockMvc mockMvc;

    @Test
    void preflightsFromTheFrontendAreAnsweredWithoutALogin() throws Exception {
        for (String[] request : new String[][] {
            {"/api/auth/login", "POST"}, {"/api/customers", "GET"}, {"/api/customers", "POST"},
            {"/api/orders/5", "PUT"}, {"/api/users/5/role", "PUT"}, {"/api/vendors/5", "DELETE"}, {"/api/ai/insights", "GET"}
        }) {
            mockMvc.perform(options(request[0])
                    .header("Origin", ALLOWED_ORIGIN)
                    .header("Access-Control-Request-Method", request[1])
                    .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }
    }

    @Test
    void preflightsFromOtherSitesAreRefused() throws Exception {
        mockMvc.perform(options("/api/customers")
                .header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void realRequestsFromTheFrontendCarryTheCorsHeaderToo() throws Exception {
        mockMvc.perform(get("/api/health").header("Origin", ALLOWED_ORIGIN))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN));
    }
}
