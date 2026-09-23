package com.ceylon.intellibiz.model;

import jakarta.validation.Valid;
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
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
public class Order {

    @Id
    private String id;

    @NotBlank
    @Indexed(unique = true)
    private String orderNumber;

    /** The customer this order belongs to (a customers._id). Checked by the controller, since Mongo has no foreign keys. */
    @Indexed
    private String customerId;

    @NotBlank
    private String channel = "Direct sales";

    // Optional: when present, OrderController recomputes totalAmount from these instead of trusting the
    // client's number, the same way MarketplaceOrder and Product's rating are derived, not trusted.
    // Not tied to an InventoryItem id (see OrderLineItem), so adding a line doesn't move stock.
    @Valid
    private List<OrderLineItem> items = new ArrayList<>();

    // Decimal128 keeps money exact; without this Spring Data would store the amount as text. Authoritative
    // only when items is empty — otherwise OrderController overwrites it with the sum of the line items.
    @NotNull
    @PositiveOrZero
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal totalAmount;

    @NotBlank
    private String status = "Processing";

    private Instant createdAt = Instant.now();
}
