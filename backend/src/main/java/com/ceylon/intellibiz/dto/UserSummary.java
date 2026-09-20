package com.ceylon.intellibiz.dto;

import com.ceylon.intellibiz.model.User;

import java.time.Instant;

/** A user as shown to admins. Deliberately has no password hash. */
public record UserSummary(String id, String username, String email, String role, Instant createdAt) {

    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}
