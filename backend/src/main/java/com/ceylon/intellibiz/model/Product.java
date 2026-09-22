package com.ceylon.intellibiz.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** A marketplace listing (software, add-on or service). Its own collection, separate from ERP "inventory_items". */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "products")
public class Product {

    @Id
    private String id;

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    @Size(max = 2000)
    private String description;

    // Decimal128 keeps money exact; without this Spring Data would store the price as text.
    @NotNull
    @PositiveOrZero
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal price;

    @NotBlank
    private String category;

    // Derived from reviews (see ReviewController) — not directly settable through the API.
    private double rating = 0;
    private int reviewCount = 0;

    private List<String> features;

    private Instant createdAt = Instant.now();
}
