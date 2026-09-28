package com.ceylon.intellibiz.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A managed marketplace category, so "Software" and "software" (or a typo) don't become two different
 * categories by accident. Product.category itself stays a plain string — see ProductController — this is
 * just the canonical list the dashboard's Add Product form picks from.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "categories")
public class Category {

    @Id
    private String id;

    @NotBlank
    @Size(max = 100)
    @Indexed(unique = true)
    private String name;

    private Instant createdAt = Instant.now();
}
