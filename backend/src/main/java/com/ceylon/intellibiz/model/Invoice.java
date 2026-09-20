package com.ceylon.intellibiz.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "invoices")
public class Invoice {

    @Id
    private String id;

    @NotBlank
    @Indexed(unique = true)
    private String invoiceNumber;

    /** The customer this invoice is for (a customers._id). Checked by the controller, since Mongo has no foreign keys. */
    @Indexed
    private String customerId;

    // Decimal128 keeps money exact; without this Spring Data would store the amount as text.
    @NotNull
    @PositiveOrZero
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal totalAmount;

    @NotBlank
    private String status = "Draft";

    private Instant createdAt = Instant.now();
}
