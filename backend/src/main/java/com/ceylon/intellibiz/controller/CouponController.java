package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.CouponPreview;
import com.ceylon.intellibiz.model.Coupon;
import com.ceylon.intellibiz.repository.CouponRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Discount codes for the marketplace checkout. Management (list/create/delete) is sales/admin only;
 * {@code /validate/{code}} is public, since checking a code you already have isn't sensitive — the actual
 * discount is still computed authoritatively server-side when the order is submitted, never trusted from
 * whatever the preview said. See MarketplaceOrderController.
 */
@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private static final BigDecimal MAX_PERCENT = BigDecimal.valueOf(100);

    private final CouponRepository couponRepository;

    public CouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @GetMapping
    public List<Coupon> list() {
        return couponRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Coupon coupon) {
        ApiError problem = checkDiscount(coupon);
        if (problem != null) {
            return ResponseEntity.badRequest().body(problem);
        }
        String code = coupon.getCode().trim().toUpperCase();
        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("That coupon code already exists."));
        }
        Coupon toSave = new Coupon();
        toSave.setCode(code);
        toSave.setDiscountType(coupon.getDiscountType());
        toSave.setDiscountValue(coupon.getDiscountValue());
        toSave.setActive(true);
        toSave.setExpiresAt(coupon.getExpiresAt());
        toSave.setCreatedAt(Instant.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(couponRepository.save(toSave));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!couponRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        couponRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Public: lets a shopper check a code before checkout. Never reveals codes that don't work as valid. */
    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validate(@PathVariable String code) {
        Optional<Coupon> found = couponRepository.findByCodeIgnoreCase(code.trim());
        if (found.isEmpty() || !isRedeemable(found.get())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("Invalid or expired coupon code."));
        }
        Coupon coupon = found.get();
        return ResponseEntity.ok(new CouponPreview(coupon.getCode(), coupon.getDiscountType(), coupon.getDiscountValue()));
    }

    /** Used by MarketplaceOrderController too, so a coupon accepted at preview time is re-checked at submit time. */
    public static boolean isRedeemable(Coupon coupon) {
        return coupon.isActive() && (coupon.getExpiresAt() == null || coupon.getExpiresAt().isAfter(Instant.now()));
    }

    private static ApiError checkDiscount(Coupon coupon) {
        String type = coupon.getDiscountType();
        if (type == null || !Coupon.DISCOUNT_TYPES.contains(type)) {
            return new ApiError("discountType must be one of: " + String.join(", ", Coupon.DISCOUNT_TYPES));
        }
        if ("PERCENT".equals(type) && coupon.getDiscountValue() != null && coupon.getDiscountValue().compareTo(MAX_PERCENT) > 0) {
            return new ApiError("A PERCENT discount cannot be more than 100.");
        }
        return null;
    }
}
