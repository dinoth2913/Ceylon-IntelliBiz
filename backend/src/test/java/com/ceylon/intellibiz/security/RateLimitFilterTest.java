package com.ceylon.intellibiz.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    private static RateLimitFilter filter(int maxRequests, long windowSeconds) {
        return new RateLimitFilter(new RateLimiter(), maxRequests, windowSeconds);
    }

    private static MockHttpServletRequest post(String uri, String remoteAddr) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.setRemoteAddr(remoteAddr);
        return request;
    }

    @Test
    void blocksTheGuardedPathOnceOverTheLimit() throws ServletException, IOException {
        RateLimitFilter filter = filter(2, 60);

        for (int i = 0; i < 2; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(post("/api/contact-requests", "10.0.0.1"), response, new MockFilterChain());
            assertEquals(200, response.getStatus(), "MockFilterChain defaults to 200 when the chain completes");
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(post("/api/contact-requests", "10.0.0.1"), blocked, new MockFilterChain());

        assertEquals(429, blocked.getStatus());
        assertEquals("60", blocked.getHeader("Retry-After"));
        assertTrue(blocked.getContentAsString().contains("Too many requests"));
    }

    @Test
    void eachGuardedEndpointHasItsOwnLimit() throws ServletException, IOException {
        RateLimitFilter filter = filter(1, 60);

        MockHttpServletResponse contactResponse = new MockHttpServletResponse();
        filter.doFilter(post("/api/contact-requests", "10.0.0.2"), contactResponse, new MockFilterChain());
        assertEquals(200, contactResponse.getStatus());

        // Same IP, different guarded endpoint — not affected by the contact-requests limit.
        MockHttpServletResponse chatResponse = new MockHttpServletResponse();
        filter.doFilter(post("/api/chat", "10.0.0.2"), chatResponse, new MockFilterChain());
        assertEquals(200, chatResponse.getStatus());

        MockHttpServletResponse marketplaceResponse = new MockHttpServletResponse();
        filter.doFilter(post("/api/marketplace-orders", "10.0.0.2"), marketplaceResponse, new MockFilterChain());
        assertEquals(200, marketplaceResponse.getStatus());
    }

    @Test
    void differentIpsAreNotAffectedByEachOther() throws ServletException, IOException {
        RateLimitFilter filter = filter(1, 60);

        MockHttpServletResponse first = new MockHttpServletResponse();
        filter.doFilter(post("/api/contact-requests", "10.0.0.3"), first, new MockFilterChain());
        assertEquals(200, first.getStatus());

        MockHttpServletResponse second = new MockHttpServletResponse();
        filter.doFilter(post("/api/contact-requests", "10.0.0.4"), second, new MockFilterChain());
        assertEquals(200, second.getStatus());
    }

    @Test
    void onlyGuardsTheSpecificPublicPostEndpoints() throws ServletException, IOException {
        RateLimitFilter filter = filter(0, 60); // 0 = block on the very first guarded call

        // GET to a guarded path is not guarded (only POST is public/unauthenticated there).
        MockHttpServletRequest getRequest = new MockHttpServletRequest("GET", "/api/chat/session-1");
        getRequest.setRemoteAddr("10.0.0.5");
        MockHttpServletResponse getResponse = new MockHttpServletResponse();
        filter.doFilter(getRequest, getResponse, new MockFilterChain());
        assertEquals(200, getResponse.getStatus());

        // An unrelated authenticated POST endpoint is not guarded by this filter at all.
        MockHttpServletResponse ordersResponse = new MockHttpServletResponse();
        filter.doFilter(post("/api/orders", "10.0.0.5"), ordersResponse, new MockFilterChain());
        assertEquals(200, ordersResponse.getStatus());

        // But the actual guarded POST path is blocked immediately with a 0 limit.
        MockHttpServletResponse chatResponse = new MockHttpServletResponse();
        filter.doFilter(post("/api/chat", "10.0.0.5"), chatResponse, new MockFilterChain());
        assertEquals(429, chatResponse.getStatus());
    }
}
