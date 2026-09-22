package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.ReviewRequest;
import com.ceylon.intellibiz.model.Review;
import com.ceylon.intellibiz.repository.ProductRepository;
import com.ceylon.intellibiz.repository.ReviewRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public ReviewController(ReviewRepository reviewRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/{productId}")
    public List<Review> getReviewsByProduct(@PathVariable String productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    /** Requires a signed-in user (enforced by SecurityConfig); the reviewer's name always comes from their account. */
    @PostMapping
    public ResponseEntity<?> createReview(@Valid @RequestBody ReviewRequest form, Authentication authentication) {
        if (!productRepository.existsById(form.productId())) {
            return ResponseEntity.badRequest().body(new ApiError("productId does not match any product."));
        }

        Review review = new Review();
        review.setProductId(form.productId());
        review.setUserName(authentication.getName());
        review.setRating(form.rating());
        review.setComment(form.comment().trim());
        review.setCreatedAt(Instant.now());
        Review saved = reviewRepository.save(review);

        // Update the product's average rating and review count
        String productId = form.productId();
        List<Review> allReviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        double avgRating = allReviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        productRepository.findById(productId).ifPresent(product -> {
            product.setRating(Math.round(avgRating * 10.0) / 10.0);
            product.setReviewCount(allReviews.size());
            productRepository.save(product);
        });

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
