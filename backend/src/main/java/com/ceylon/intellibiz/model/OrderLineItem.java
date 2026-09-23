package com.ceylon.intellibiz.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;

/**
 * One line of an {@link Order}. Embedded in the order document, not its own collection — and not tied to
 * an {@link InventoryItem} by id, so a line can describe anything (a custom service, a bundle) and not
 * just stocked SKUs. That also means there's no stock-quantity integration yet: adding a line here
 * doesn't move inventory.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderLineItem {

    @NotBlank
    private String description;

    @Positive
    private int quantity;

    @NotNull
    @PositiveOrZero
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal unitPrice;
}
