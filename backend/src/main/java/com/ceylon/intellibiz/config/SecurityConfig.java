package com.ceylon.intellibiz.config;

import com.ceylon.intellibiz.security.JwtAuthenticationFilter;
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

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, RestAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
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
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
