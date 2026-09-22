package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.MarketplaceOrder;
import com.ceylon.intellibiz.model.Product;
import com.ceylon.intellibiz.model.Review;
import com.ceylon.intellibiz.repository.MarketplaceOrderRepository;
import com.ceylon.intellibiz.repository.ProductRepository;
import com.ceylon.intellibiz.repository.ReviewRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class ProductControllerTest {

    static ProductRepository fakeProductRepository(List<Product> store) {
        return (ProductRepository) Proxy.newProxyInstance(
            ProductControllerTest.class.getClassLoader(),
            new Class<?>[] {ProductRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Product product = (Product) args[0];
                    if (product.getId() == null) {
                        product.setId(String.valueOf(store.size() + 1));
                    }
                    store.removeIf(existing -> existing.getId().equals(product.getId()));
                    store.add(product);
                    yield product;
                }
                case "findById" -> store.stream().filter(p -> p.getId().equals(args[0])).findFirst();
                case "existsById" -> store.stream().anyMatch(p -> p.getId().equals(args[0]));
                case "findAll" -> new ArrayList<>(store);
                case "deleteById" -> {
                    store.removeIf(p -> p.getId().equals(args[0]));
                    yield null;
                }
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeProductRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    @SuppressWarnings("unchecked")
    static ReviewRepository fakeReviewRepository(List<Review> store) {
        return (ReviewRepository) Proxy.newProxyInstance(
            ProductControllerTest.class.getClassLoader(),
            new Class<?>[] {ReviewRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "findByProductIdOrderByCreatedAtDesc" -> store.stream()
                    .filter(r -> r.getProductId().equals(args[0]))
                    .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
                    .collect(Collectors.toList());
                case "deleteAll" -> {
                    store.removeAll((Collection<Review>) args[0]);
                    yield null;
                }
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeReviewRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static MarketplaceOrderRepository fakeMarketplaceOrderRepository(List<MarketplaceOrder> store) {
        return (MarketplaceOrderRepository) Proxy.newProxyInstance(
            ProductControllerTest.class.getClassLoader(),
            new Class<?>[] {MarketplaceOrderRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "existsByProductId" -> store.stream().anyMatch(o -> o.getProductId().equals(args[0]));
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeMarketplaceOrderRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Product> products = new ArrayList<>();
    private final List<Review> reviews = new ArrayList<>();
    private final List<MarketplaceOrder> marketplaceOrders = new ArrayList<>();
    private ProductController controller;

    @BeforeEach
    void setUp() {
        products.clear();
        reviews.clear();
        marketplaceOrders.clear();
        controller = new ProductController(
            fakeProductRepository(products), fakeReviewRepository(reviews), fakeMarketplaceOrderRepository(marketplaceOrders));
    }

    private static Product newProduct(String title, String price) {
        Product product = new Product();
        product.setTitle(title);
        product.setDescription("A great add-on");
        product.setPrice(new BigDecimal(price));
        product.setCategory("Add-on");
        return product;
    }

    @Test
    void creatingAProductIgnoresClientSuppliedIdRatingAndReviewCount() {
        Product incoming = newProduct("AI Forecasting Module", "125000");
        incoming.setId("someone-elses-id");
        incoming.setRating(5);
        incoming.setReviewCount(99);

        Product saved = controller.createProduct(incoming);

        assertNotNull(saved.getId());
        assertTrue(!saved.getId().equals("someone-elses-id"));
        assertEquals(0, saved.getRating());
        assertEquals(0, saved.getReviewCount());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void updatingAProductLeavesDerivedRatingFieldsAlone() {
        Product saved = controller.createProduct(newProduct("Implementation Consultation", "180000"));
        saved.setRating(4.5);
        saved.setReviewCount(10);
        products.set(0, saved);

        Product update = newProduct("Implementation Consultation (Updated)", "200000");
        update.setRating(1); // ignored: not settable through update either
        ResponseEntity<Product> response = controller.updateProduct(saved.getId(), update);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Product body = response.getBody();
        assertNotNull(body);
        assertEquals("Implementation Consultation (Updated)", body.getTitle());
        assertEquals(new BigDecimal("200000"), body.getPrice());
        assertEquals(4.5, body.getRating());
        assertEquals(10, body.getReviewCount());
    }

    @Test
    void updatingAMissingProductReturns404() {
        ResponseEntity<Product> response = controller.updateProduct("missing", newProduct("x", "1"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void deletingAMissingProductReturns404() {
        ResponseEntity<?> response = controller.deleteProduct("missing");
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void deletingAProductCascadesItsReviews() {
        Product saved = controller.createProduct(newProduct("Vendor API Access", "65000"));
        Review review = new Review();
        review.setProductId(saved.getId());
        review.setUserName("asha");
        review.setRating(5);
        review.setComment("Great");
        reviews.add(review);

        ResponseEntity<?> response = controller.deleteProduct(saved.getId());

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertTrue(products.isEmpty());
        assertTrue(reviews.isEmpty());
    }

    @Test
    void aProductWithPurchaseRequestsCannotBeDeleted() {
        Product saved = controller.createProduct(newProduct("Enterprise ERP License", "450000"));
        MarketplaceOrder order = new MarketplaceOrder();
        order.setProductId(saved.getId());
        marketplaceOrders.add(order);

        ResponseEntity<?> response = controller.deleteProduct(saved.getId());

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("This product has purchase requests and cannot be deleted.", ((ApiError) response.getBody()).getMessage());
        assertEquals(1, products.size());
    }
}
