package com.ceylon.intellibiz.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.Map;

/**
 * A simple in-memory sliding-window limiter: allows at most {@code maxRequests} calls per key in any
 * {@code window}, keyed by whatever the caller passes in (here, "client IP + endpoint"). It's in-memory
 * and per-instance on purpose — this app runs as a single backend container with no Redis, so anything
 * shared-state would be a dependency this project doesn't otherwise need. A caveat that comes with that:
 * restarting the backend clears every limiter, and running more than one backend instance would let each
 * instance track its own count instead of a shared one.
 */
@Component
public class RateLimiter {

    private final Map<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    /** Returns true if this call is allowed, false if the key is over its limit for the current window. */
    public boolean allow(String key, int maxRequests, Duration window) {
        Instant cutoff = Instant.now().minus(window);
        Deque<Instant> timestamps = hits.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                return false;
            }
            timestamps.addLast(Instant.now());
            return true;
        }
    }
}
