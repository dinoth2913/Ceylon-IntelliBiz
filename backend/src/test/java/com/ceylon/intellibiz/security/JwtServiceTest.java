package com.ceylon.intellibiz.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String GOOD_SECRET = "a-long-random-secret-that-is-at-least-32-chars";

    @Test
    void refusesToStartWithoutASecret() {
        assertThrows(IllegalStateException.class, () -> new JwtService(null, 1000));
        assertThrows(IllegalStateException.class, () -> new JwtService("", 1000));
    }

    @Test
    void refusesAWeakSecret() {
        IllegalStateException error = assertThrows(IllegalStateException.class, () -> new JwtService("too-short", 1000));
        assertTrue(error.getMessage().contains("JWT_SECRET"));
        assertTrue(error.getMessage().contains("generate-env"), "the error should say how to fix it");
    }

    @Test
    void refusesTheOldPublishedDefaultAndAnythingThatLooksLikeAPlaceholder() {
        String oldDefault = "ceylon-intellibiz-dev-secret-change-me-in-production-please-0123456789";
        assertThrows(IllegalStateException.class, () -> new JwtService(oldDefault, 1000));
        assertThrows(IllegalStateException.class, () -> new JwtService("Please-CHANGE-ME-to-something-real-0123456789", 1000));
    }

    @Test
    void issuesAndVerifiesTokensWithAGoodSecret() {
        JwtService service = new JwtService(GOOD_SECRET, 60_000);

        String token = service.generateToken(7L, "asha", "SALES");
        Claims claims = service.parseClaims(token);

        assertEquals("asha", claims.getSubject());
        assertEquals("SALES", claims.get("role", String.class));
        assertTrue(service.isValid(token));
    }

    @Test
    void aTokenSignedWithADifferentSecretIsRejected() {
        String forged = new JwtService("another-completely-different-secret-value-1234", 60_000).generateToken(1L, "asha", "ADMIN");

        assertFalse(new JwtService(GOOD_SECRET, 60_000).isValid(forged));
    }

    @Test
    void expiredTokensAreRejected() {
        JwtService service = new JwtService(GOOD_SECRET, -1000);
        assertFalse(service.isValid(service.generateToken(1L, "asha", "SALES")));
    }
}
