package com.ceylon.intellibiz.security;

import com.ceylon.intellibiz.dto.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

/**
 * Limits the public, unauthenticated POST endpoints that anyone on the internet can call without
 * signing in — the demo-request form, the chat widget and the marketplace checkout — so a script can't
 * hammer them. Authenticated endpoints aren't covered: a signed-in account is already identifiable and
 * revocable (see JwtAuthenticationFilter/Team page), which a bare IP limiter isn't a substitute for.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> GUARDED_PATHS = Set.of("/api/contact-requests", "/api/chat", "/api/marketplace-orders");
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RateLimiter rateLimiter;
    private final int maxRequests;
    private final Duration window;

    public RateLimitFilter(
        RateLimiter rateLimiter,
        @Value("${app.rate-limit.max-requests:5}") int maxRequests,
        @Value("${app.rate-limit.window-seconds:60}") long windowSeconds
    ) {
        this.rateLimiter = rateLimiter;
        this.maxRequests = maxRequests;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        boolean guarded = "POST".equalsIgnoreCase(request.getMethod()) && GUARDED_PATHS.contains(request.getRequestURI());

        if (guarded) {
            String key = request.getRemoteAddr() + "|" + request.getRequestURI();
            if (!rateLimiter.allow(key, maxRequests, window)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", String.valueOf(window.toSeconds()));
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(JSON.writeValueAsString(
                    new ApiError("Too many requests. Please wait a moment and try again.")));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
