package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.MarketplaceOrderRequest;
import com.ceylon.intellibiz.model.Coupon;
import com.ceylon.intellibiz.model.MarketplaceOrder;
import com.ceylon.intellibiz.model.Product;
import com.ceylon.intellibiz.repository.CouponRepository;
import com.ceylon.intellibiz.repository.MarketplaceOrderRepository;
import com.ceylon.intellibiz.repository.ProductRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class MarketplaceOrderControllerTest {

    static ProductRepository fakeProductRepository(List<Product> store) {
        return (ProductRepository) Proxy.newProxyInstance(
            MarketplaceOrderControllerTest.class.getClassLoader(),
            new Class<?>[] {ProductRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "findById" -> store.stream().filter(p -> p.getId().equals(args[0])).findFirst();
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeProductRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static MarketplaceOrderRepository fakeMarketplaceOrderRepository(List<MarketplaceOrder> store) {
        return (MarketplaceOrderRepository) Proxy.newProxyInstance(
            MarketplaceOrderControllerTest.class.getClassLoader(),
            new Class<?>[] {MarketplaceOrderRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    MarketplaceOrder order = (MarketplaceOrder) args[0];
                    order.setId(String.valueOf(store.size() + 1));
                    store.add(order);
                    yield order;
                }
                case "findAllByOrderByCreatedAtDesc" -> {
                    List<MarketplaceOrder> newestFirst = new ArrayList<>(store);
                    Collections.reverse(newestFirst);
                    yield newestFirst;
                }
                case "existsByProductId" -> store.stream().anyMatch(o -> o.getProductId().equals(args[0]));
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeMarketplaceOrderRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static CouponRepository fakeCouponRepository(List<Coupon> store) {
        return (CouponRepository) Proxy.newProxyInstance(
            MarketplaceOrderControllerTest.class.getClassLoader(),
            new Class<?>[] {CouponRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "findByCodeIgnoreCase" -> store.stream().filter(c -> c.getCode().equalsIgnoreCase((String) args[0])).findFirst();
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeCouponRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Product> products = new ArrayList<>();
    private final List<MarketplaceOrder> orders = new ArrayList<>();
    private final List<Coupon> coupons = new ArrayList<>();
    private MarketplaceOrderController controller;

    @BeforeEach
    void setUp() {
        products.clear();
        orders.clear();
        coupons.clear();
        controller = new MarketplaceOrderController(
            fakeMarketplaceOrderRepository(orders), fakeProductRepository(products), fakeCouponRepository(coupons));

        Product product = new Product();
        product.setId("prod-1");
        product.setTitle("AI Forecasting Module");
        product.setDescription("desc");
        product.setPrice(new BigDecimal("125000"));
        product.setCategory("Add-on");
        products.add(product);
    }

    private static Coupon percentCoupon(String code, String value) {
        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDiscountType("PERCENT");
        coupon.setDiscountValue(new BigDecimal(value));
        coupon.setActive(true);
        return coupon;
    }

    private static Coupon fixedCoupon(String code, String value) {
        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDiscountType("FIXED");
        coupon.setDiscountValue(new BigDecimal(value));
        coupon.setActive(true);
        return coupon;
    }

    @Test
    void submittingARequestSnapshotsTheProductAndComputesTheTotal() {
        ResponseEntity<?> response = controller.submit(new MarketplaceOrderRequest("prod-1", 3, "Asha Perera", "asha@company.lk", "Ceylon Traders", null));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        MarketplaceOrder saved = (MarketplaceOrder) response.getBody();
        assertNotNull(saved);
        assertEquals("AI Forecasting Module", saved.getProductTitle());
        assertEquals(new BigDecimal("125000"), saved.getUnitPrice());
        assertEquals(new BigDecimal("375000"), saved.getSubtotal());
        assertEquals(BigDecimal.ZERO, saved.getDiscountAmount());
        assertEquals(new BigDecimal("375000"), saved.getTotalAmount());
        assertNull(saved.getCouponCode());
        assertEquals("Requested", saved.getStatus());
        assertEquals("Asha Perera", saved.getBuyerName());
    }

    @Test
    void aBlankCompanyIsStoredAsNull() {
        ResponseEntity<?> response = controller.submit(new MarketplaceOrderRequest("prod-1", 1, "Asha", "asha@company.lk", "   ", null));

        MarketplaceOrder saved = (MarketplaceOrder) response.getBody();
        assertNotNull(saved);
        assertNull(saved.getBuyerCompany());
    }

    @Test
    void aRequestForAMissingProductIsRejectedAndNothingIsStored() {
        ResponseEntity<?> response = controller.submit(new MarketplaceOrderRequest("no-such-product", 1, "Asha", "asha@company.lk", null, null));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("productId does not match any product.", ((ApiError) response.getBody()).getMessage());
        assertEquals(0, orders.size());
    }

    @Test
    void listReturnsNewestFirst() {
        controller.submit(new MarketplaceOrderRequest("prod-1", 1, "First", "first@company.lk", null, null));
        controller.submit(new MarketplaceOrderRequest("prod-1", 1, "Second", "second@company.lk", null, null));

        List<MarketplaceOrder> list = controller.list();

        assertEquals(2, list.size());
        assertEquals("Second", list.get(0).getBuyerName());
        assertEquals("First", list.get(1).getBuyerName());
    }

    @Test
    void aValidPercentCouponDiscountsTheTotal() {
        coupons.add(percentCoupon("SAVE10", "10"));

        ResponseEntity<?> response = controller.submit(new MarketplaceOrderRequest("prod-1", 1, "Asha", "asha@company.lk", null, "save10"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        MarketplaceOrder saved = (MarketplaceOrder) response.getBody();
        assertNotNull(saved);
        assertEquals(new BigDecimal("125000"), saved.getSubtotal());
        assertEquals(new BigDecimal("12500.00"), saved.getDiscountAmount());
        assertEquals(new BigDecimal("112500.00"), saved.getTotalAmount());
        assertEquals("SAVE10", saved.getCouponCode());
    }

    @Test
    void aFixedCouponNeverDiscountsBelowZero() {
        coupons.add(fixedCoupon("HUGE", "999999"));

        ResponseEntity<?> response = controller.submit(new MarketplaceOrderRequest("prod-1", 1, "Asha", "asha@company.lk", null, "HUGE"));

        MarketplaceOrder saved = (MarketplaceOrder) response.getBody();
        assertNotNull(saved);
        assertEquals(new BigDecimal("125000"), saved.getDiscountAmount());
        assertEquals(BigDecimal.ZERO.setScale(0), saved.getTotalAmount().setScale(0));
    }

    @Test
    void anInvalidCouponCodeRejectsTheWholeRequest() {
        ResponseEntity<?> response = controller.submit(new MarketplaceOrderRequest("prod-1", 1, "Asha", "asha@company.lk", null, "NOPE"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid or expired coupon code.", ((ApiError) response.getBody()).getMessage());
        assertEquals(0, orders.size());
    }

    @Test
    void anInactiveCouponIsRejectedAtSubmitTimeEvenIfItPassedPreviewEarlier() {
        Coupon coupon = percentCoupon("PAUSED", "10");
        coupon.setActive(false);
        coupons.add(coupon);

        ResponseEntity<?> response = controller.submit(new MarketplaceOrderRequest("prod-1", 1, "Asha", "asha@company.lk", null, "PAUSED"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}
