package com.ceylon.intellibiz.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Public marketplace checkout form. There is no payment gateway, so this just files a purchase request. */
public record MarketplaceOrderRequest(
    @NotBlank String productId,
    @Min(1) @Max(100) int quantity,
    @NotBlank @Size(max = 255) String buyerName,
    @NotBlank @Email @Size(max = 255) String buyerEmail,
    @Size(max = 255) String buyerCompany
) {
}
