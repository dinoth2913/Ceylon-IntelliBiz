package com.ceylon.intellibiz.dto;

import java.math.BigDecimal;

/** What an anonymous shopper is allowed to see about a coupon before checking out — nothing sensitive. */
public record CouponPreview(String code, String discountType, BigDecimal discountValue) {
}
