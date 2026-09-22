package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.ReviewRequest;
import com.ceylon.intellibiz.model.Product;
import com.ceylon.intellibiz.model.Review;
import com.ceylon.intellibiz.repository.ProductRepository;
import com.ceylon.intellibiz.repository.ReviewRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class ReviewControllerTest {

    static ProductRepository fakeProductRepository(List<Product> store) {
        return (ProductRepository) Proxy.newProxyInstance(
            ReviewControllerTest.class.getClassLoader(),
            new Class<?>[] {ProductRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Product product = (Product) args[0];
                    store.removeIf(existing -> existing.getId().equals(product.getId()));
                    store.add(product);
                    yield product;
                }
                case "findById" -> store.stream().filter(p -> p.getId().equals(args[0])).findFirst();
                case "existsById" -> store.stream().anyMatch(p -> p.getId().equals(args[0]));
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeProductRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static ReviewRepository fakeReviewRepository(List<Review> store) {
        return (ReviewRepository) Proxy.newProxyInstance(
            ReviewControllerTest.class.getClassLoader(),
            new Class<?>[] {ReviewRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Review review = (Review) args[0];
                    review.setId(String.valueOf(store.size() + 1));
                    store.add(review);
                    yield review;
                }
                case "findByProductIdOrderByCreatedAtDesc" -> store.stream()
                    .filter(r -> r.getProductId().equals(args[0]))
                    .sorted(Comparator.comparing(Review::getCreatedAt).reversed())
                    .collect(Collectors.toList());
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeReviewRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Product> products = new ArrayList<>();
    private final List<Review> reviews = new ArrayList<>();
    private ReviewController controller;

    @BeforeEach
    void setUp() {
        products.clear();
        reviews.clear();
        controller = new ReviewController(fakeReviewRepository(reviews), fakeProductRepository(products));

        Product product = new Product();
        product.setId("prod-1");
        product.setTitle("AI Forecasting Module");
        product.setDescription("desc");
        product.setPrice(new BigDecimal("125000"));
        product.setCategory("Add-on");
        products.add(product);
    }

    private static Authentication signedInAs(String username) {
        return new UsernamePasswordAuthenticationToken(username, null, List.of(new SimpleGrantedAuthority("ROLE_SALES")));
    }

    @Test
    void theReviewersNameAlwaysComesFromTheSignedInAccountNeverTheRequestBody() {
        ResponseEntity<?> response = controller.createReview(new ReviewRequest("prod-1", 5, "Excellent"), signedInAs("asha"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Review saved = (Review) response.getBody();
        assertNotNull(saved);
        assertEquals("asha", saved.getUserName());
    }

    @Test
    void aReviewForAMissingProductIsRejected() {
        ResponseEntity<?> response = controller.createReview(new ReviewRequest("no-such-product", 5, "Excellent"), signedInAs("asha"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("productId does not match any product.", ((ApiError) response.getBody()).getMessage());
        assertEquals(0, reviews.size());
    }

    @Test
    void theProductsAverageRatingAndCountAreRecomputedAfterEachReview() {
        controller.createReview(new ReviewRequest("prod-1", 4, "Good"), signedInAs("asha"));
        controller.createReview(new ReviewRequest("prod-1", 2, "Meh"), signedInAs("kasun"));

        Product product = products.get(0);
        assertEquals(3.0, product.getRating());
        assertEquals(2, product.getReviewCount());
    }
}
