package com.ceylon.intellibiz.dto;

/** The one and only time a reset password is shown in plain text — never persisted, never logged. */
public record PasswordResetResult(String userId, String username, String temporaryPassword) {
}
