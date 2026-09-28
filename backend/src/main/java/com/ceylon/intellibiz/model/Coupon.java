package com.ceylon.intellibiz.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** A discount code, redeemable on the public marketplace checkout. See MarketplaceOrderController. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "coupons")
public class Coupon {

    /** The only values {@link #discountType} may hold — checked by CouponController. */
    public static final Set<String> DISCOUNT_TYPES = new LinkedHashSet<>(List.of("PERCENT", "FIXED"));

    @Id
    private String id;

    /** Always stored upper-cased — checked case-insensitively at redemption anyway, but this keeps it consistent. */
    @NotBlank
    @Indexed(unique = true)
    private String code;

    @NotBlank
    private String discountType = "PERCENT";

    // For PERCENT this is 1-100 (checked by the controller); for FIXED it's an LKR amount.
    @NotNull
    @Positive
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal discountValue;

    private boolean active = true;

    /** Null means it never expires. */
    private Instant expiresAt;

    private Instant createdAt = Instant.now();
}
