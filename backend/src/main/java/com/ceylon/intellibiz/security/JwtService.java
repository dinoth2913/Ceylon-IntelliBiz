package com.ceylon.intellibiz.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    static final int MIN_SECRET_LENGTH = 32;

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration-ms}") long expirationMs
    ) {
        this.signingKey = Keys.hmacShaKeyFor(validate(secret).getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * The signing key is what stops anyone forging a login, so refuse to start with a weak or
     * placeholder one instead of quietly running with something guessable.
     */
    static String validate(String secret) {
        if (secret == null || secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                "JWT_SECRET (jwt.secret) must be set to a random value of at least " + MIN_SECRET_LENGTH
                    + " characters. Generate one with: node scripts/generate-env.js");
        }
        if (secret.toLowerCase().contains("change-me")) {
            throw new IllegalStateException(
                "JWT_SECRET (jwt.secret) is still a placeholder value. Generate a real one with: node scripts/generate-env.js");
        }
        return secret;
    }

    public String generateToken(String userId, String username, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
            .subject(username)
            .claim("userId", userId)
            .claim("role", role)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}
