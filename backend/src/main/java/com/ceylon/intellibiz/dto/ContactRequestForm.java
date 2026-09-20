package com.ceylon.intellibiz.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public demo/contact form. {@code website} is a honeypot: it is hidden from people in the UI, so
 * anything a bot puts in it marks the submission as spam.
 */
public record ContactRequestForm(
    @NotBlank @Size(max = 255) String name,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(max = 255) String company,
    @Size(max = 2000) String message,
    String website
) {
}
