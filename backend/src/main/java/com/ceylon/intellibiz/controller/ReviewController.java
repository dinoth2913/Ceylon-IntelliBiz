package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.model.Review;
import com.ceylon.intellibiz.model.Product;
import com.ceylon.intellibiz.repository.ReviewRepository;
import com.ceylon.intellibiz.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/{productId}")
    public List<Review> getReviewsByProduct(@PathVariable String productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        review.setCreatedAt(Instant.now());
        Review saved = reviewRepository.save(review);

        // Update the product's average rating and review count
        String productId = review.getProductId();
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

        return ResponseEntity.ok(saved);
    }
}
