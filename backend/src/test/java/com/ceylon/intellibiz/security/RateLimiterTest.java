package com.ceylon.intellibiz.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class RateLimiterTest {

    @Test
    void allowsUpToTheLimitThenBlocks() {
        RateLimiter limiter = new RateLimiter();

        for (int i = 0; i < 5; i++) {
            assertTrue(limiter.allow("client-a", 5, Duration.ofMinutes(1)), "call " + (i + 1) + " should be allowed");
        }
        assertFalse(limiter.allow("client-a", 5, Duration.ofMinutes(1)));
    }

    @Test
    void differentKeysHaveIndependentLimits() {
        RateLimiter limiter = new RateLimiter();

        for (int i = 0; i < 5; i++) {
            assertTrue(limiter.allow("client-a", 5, Duration.ofMinutes(1)));
        }
        assertFalse(limiter.allow("client-a", 5, Duration.ofMinutes(1)));

        // A different key (e.g. a different IP, or the same IP on a different endpoint) is unaffected.
        assertTrue(limiter.allow("client-b", 5, Duration.ofMinutes(1)));
    }

    @Test
    void aCallOutsideTheWindowIsForgotten() {
        RateLimiter limiter = new RateLimiter();
        Duration tinyWindow = Duration.ofMillis(50);

        for (int i = 0; i < 3; i++) {
            assertTrue(limiter.allow("client-a", 3, tinyWindow));
        }
        assertFalse(limiter.allow("client-a", 3, tinyWindow));

        await(120);

        assertTrue(limiter.allow("client-a", 3, tinyWindow), "the earlier calls should have aged out of the window");
    }

    private static void await(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
