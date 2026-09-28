package com.ceylon.intellibiz.dto;

import jakarta.validation.constraints.NotBlank;

public record ContactRequestStatusUpdate(@NotBlank String status) {
}
