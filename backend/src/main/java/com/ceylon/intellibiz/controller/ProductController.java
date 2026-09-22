package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.Product;
import com.ceylon.intellibiz.repository.MarketplaceOrderRepository;
import com.ceylon.intellibiz.repository.ProductRepository;
import com.ceylon.intellibiz.repository.ReviewRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final MarketplaceOrderRepository marketplaceOrderRepository;

    public ProductController(
        ProductRepository productRepository,
        ReviewRepository reviewRepository,
        MarketplaceOrderRepository marketplaceOrderRepository
    ) {
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
        this.marketplaceOrderRepository = marketplaceOrderRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        Optional<Product> product = productRepository.findById(id);
        return product.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public List<Product> getProductsByCategory(@PathVariable String category) {
        return productRepository.findByCategory(category);
    }

    @GetMapping("/search")
    public List<Product> searchProducts(@RequestParam String keyword) {
        return productRepository.findByTitleContainingIgnoreCase(keyword);
    }

    @PostMapping
    public Product createProduct(@Valid @RequestBody Product product) {
        product.setId(null);
        // Rating and review count are derived from actual reviews, never trusted from the request.
        product.setRating(0);
        product.setReviewCount(0);
        product.setCreatedAt(Instant.now());
        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @Valid @RequestBody Product update) {
        return productRepository.findById(id)
            .map(existing -> {
                existing.setTitle(update.getTitle());
                existing.setDescription(update.getDescription());
                existing.setPrice(update.getPrice());
                existing.setCategory(update.getCategory());
                existing.setFeatures(update.getFeatures());
                // Rating/reviewCount stay derived — not editable through this endpoint.
                return ResponseEntity.ok(productRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable String id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        if (marketplaceOrderRepository.existsByProductId(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("This product has purchase requests and cannot be deleted."));
        }
        reviewRepository.deleteAll(reviewRepository.findByProductIdOrderByCreatedAtDesc(id));
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
