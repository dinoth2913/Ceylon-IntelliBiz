package com.ceylon.intellibiz.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The reviewer's name comes from their signed-in account, not the request body — see ReviewController. */
public record ReviewRequest(
    @NotBlank String productId,
    @Min(1) @Max(5) int rating,
    @NotBlank @Size(max = 1000) String comment
) {
}
