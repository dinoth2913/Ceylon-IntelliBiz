package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.CouponPreview;
import com.ceylon.intellibiz.model.Coupon;
import com.ceylon.intellibiz.repository.CouponRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class CouponControllerTest {

    static CouponRepository fakeCouponRepository(List<Coupon> store) {
        return (CouponRepository) Proxy.newProxyInstance(
            CouponControllerTest.class.getClassLoader(),
            new Class<?>[] {CouponRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Coupon coupon = (Coupon) args[0];
                    if (coupon.getId() == null) {
                        coupon.setId(String.valueOf(store.size() + 1));
                    }
                    store.removeIf(existing -> existing.getId().equals(coupon.getId()));
                    store.add(coupon);
                    yield coupon;
                }
                case "findByCodeIgnoreCase" -> store.stream()
                    .filter(c -> c.getCode().equalsIgnoreCase((String) args[0]))
                    .findFirst();
                case "existsById" -> store.stream().anyMatch(c -> c.getId().equals(args[0]));
                case "deleteById" -> {
                    store.removeIf(c -> c.getId().equals(args[0]));
                    yield null;
                }
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeCouponRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Coupon> coupons = new ArrayList<>();
    private CouponController controller;

    @BeforeEach
    void setUp() {
        coupons.clear();
        controller = new CouponController(fakeCouponRepository(coupons));
    }

    private static Coupon percentCoupon(String code, String value) {
        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDiscountType("PERCENT");
        coupon.setDiscountValue(new BigDecimal(value));
        return coupon;
    }

    @Test
    void createsACouponWithTheCodeUppercased() {
        ResponseEntity<?> response = controller.create(percentCoupon("save10", "10"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Coupon saved = (Coupon) response.getBody();
        assertNotNull(saved);
        assertEquals("SAVE10", saved.getCode());
        assertTrue(saved.isActive());
    }

    @Test
    void aPercentDiscountOverOneHundredIsRejected() {
        ResponseEntity<?> response = controller.create(percentCoupon("TOOMUCH", "150"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(0, coupons.size());
    }

    @Test
    void anInvalidDiscountTypeIsRejected() {
        Coupon coupon = percentCoupon("BADTYPE", "10");
        coupon.setDiscountType("HALF_PRICE");

        ResponseEntity<?> response = controller.create(coupon);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void duplicateCodesAreRejectedCaseInsensitively() {
        controller.create(percentCoupon("SAVE10", "10"));

        ResponseEntity<?> response = controller.create(percentCoupon("save10", "20"));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(1, coupons.size());
    }

    @Test
    void validatingAnActiveCouponReturnsItsPreview() {
        controller.create(percentCoupon("SAVE10", "10"));

        ResponseEntity<?> response = controller.validate("save10");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        CouponPreview preview = (CouponPreview) response.getBody();
        assertNotNull(preview);
        assertEquals("SAVE10", preview.code());
        assertEquals("PERCENT", preview.discountType());
    }

    @Test
    void validatingAnUnknownCodeReturns404WithoutRevealingWhy() {
        ResponseEntity<?> response = controller.validate("NOPE");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Invalid or expired coupon code.", ((ApiError) response.getBody()).getMessage());
    }

    @Test
    void anExpiredCouponFailsValidation() {
        Coupon coupon = percentCoupon("EXPIRED", "10");
        coupon.setExpiresAt(Instant.now().minus(1, ChronoUnit.DAYS));
        controller.create(coupon);

        ResponseEntity<?> response = controller.validate("EXPIRED");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void anInactiveCouponFailsValidation() {
        Coupon saved = (Coupon) controller.create(percentCoupon("PAUSED", "10")).getBody();
        saved.setActive(false);

        ResponseEntity<?> response = controller.validate("PAUSED");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void deletingRemovesTheCoupon() {
        Coupon saved = (Coupon) controller.create(percentCoupon("GONE", "10")).getBody();

        ResponseEntity<Void> response = controller.delete(saved.getId());

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertEquals(0, coupons.size());
    }
}
