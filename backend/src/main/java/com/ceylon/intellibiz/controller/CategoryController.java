package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.Category;
import com.ceylon.intellibiz.repository.CategoryRepository;
import com.ceylon.intellibiz.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryController(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Category> list() {
        return categoryRepository.findAllByOrderByNameAsc();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Category category) {
        String name = category.getName().trim();
        boolean exists = categoryRepository.findAllByOrderByNameAsc().stream()
            .anyMatch(existing -> existing.getName().equalsIgnoreCase(name));
        if (exists) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("That category already exists."));
        }
        Category toSave = new Category();
        toSave.setName(name);
        toSave.setCreatedAt(Instant.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryRepository.save(toSave));
    }

    /** Refuses to delete a category that products are still using, since Product.category is a plain string, not a reference. */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return categoryRepository.findById(id)
            .<ResponseEntity<?>>map(category -> {
                if (!productRepository.findByCategory(category.getName()).isEmpty()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ApiError("This category is used by at least one product and cannot be deleted."));
                }
                categoryRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
