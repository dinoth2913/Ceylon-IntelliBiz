package com.ceylon.intellibiz.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "customers")
public class Customer {

    /**
     * The only values {@link #segment} may hold — checked by CustomerController, since Mongo has no enum
     * type. A {@code LinkedHashSet}, not {@code Set.of(...)}: the latter's iteration order is randomised
     * per JVM run, which would make the "segment must be one of: ..." error message read differently
     * every time the backend restarts.
     */
    public static final Set<String> SEGMENTS =
        new LinkedHashSet<>(List.of("Enterprise", "SME", "Retail"));

    @Id
    private String id;

    @NotBlank
    private String fullName;

    private String companyName;

    private String email;

    private String phone;

    // One of Customer.SEGMENTS — checked by the controller, since Mongo has no enum type.
    private String segment = "SME";

    private Instant createdAt = Instant.now();
}
