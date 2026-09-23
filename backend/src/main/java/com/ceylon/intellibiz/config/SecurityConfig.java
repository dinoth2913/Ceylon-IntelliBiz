package com.ceylon.intellibiz.config;

import com.ceylon.intellibiz.security.JwtAuthenticationFilter;
import com.ceylon.intellibiz.security.RateLimitFilter;
import com.ceylon.intellibiz.security.RestAuthenticationEntryPoint;
import com.ceylon.intellibiz.security.Roles;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.Customizer;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Adding a new controller? It's admin-only by default (see the bottom of the rule list below) — that's
 * safe, but easy to forget about if that's not actually what you want. Checklist:
 *   1. Add a {@code .requestMatchers(...)} line here for its real access level (or leave it admin-only
 *      on purpose — some things should be).
 *   2. Add a case to {@code RoleAccessRulesTest} covering it.
 *   3. {@code SecurityCoverageTest} fails the build if you skip step 1 entirely (it just checks the path
 *      is mentioned somewhere here, not that the rule is correct — that's what step 2 is for).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfig(
        JwtAuthenticationFilter jwtAuthenticationFilter,
        RateLimitFilter rateLimitFilter,
        RestAuthenticationEntryPoint authenticationEntryPoint
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        String[] business = Roles.BUSINESS;

        http
            .csrf(AbstractHttpConfigurer::disable)
            // Uses the CorsConfigurationSource bean, so browser preflights are answered before the rules below.
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(handling -> handling.authenticationEntryPoint(authenticationEntryPoint))
            // Rules are checked top to bottom and the first match wins.
            .authorizeHttpRequests(auth -> auth
                // --- Public ---
                .requestMatchers("/api/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/chat/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/chat").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/contact-requests").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/marketplace-orders").permitAll()

                // --- Any signed-in user, whatever their role ---
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/reviews").authenticated()

                // --- Admin only ---
                .requestMatchers("/api/users/**").hasRole(Roles.ADMIN)
                // Redundant with the deny-by-default rule at the bottom, but explicit on purpose — see SecurityCoverageTest.
                .requestMatchers("/api/db-test").hasRole(Roles.ADMIN)

                // --- Sales and admin: demo requests, marketplace catalogue and purchase requests ---
                .requestMatchers("/api/contact-requests/**").hasAnyRole(Roles.ADMIN, Roles.SALES)
                .requestMatchers("/api/products/**").hasAnyRole(Roles.ADMIN, Roles.SALES)
                .requestMatchers("/api/marketplace-orders/**").hasAnyRole(Roles.ADMIN, Roles.SALES)

                // --- Business data: everyone with a business role can read ---
                .requestMatchers("/api/ai/**").hasAnyRole(business)
                .requestMatchers(HttpMethod.GET, "/api/customers/**", "/api/orders/**", "/api/invoices/**", "/api/inventory/**", "/api/vendors/**")
                    .hasAnyRole(business)

                // --- ...but each area is only written by the roles that own it ---
                .requestMatchers("/api/customers/**", "/api/orders/**", "/api/inventory/**", "/api/vendors/**")
                    .hasAnyRole(Roles.ADMIN, Roles.SALES)
                .requestMatchers("/api/invoices/**").hasAnyRole(Roles.ADMIN, Roles.FINANCE)

                // --- Deny by default: anything under /api nobody listed above is admin-only ---
                .requestMatchers("/api/**").hasRole(Roles.ADMIN)
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class);
        return http.build();
    }
}
