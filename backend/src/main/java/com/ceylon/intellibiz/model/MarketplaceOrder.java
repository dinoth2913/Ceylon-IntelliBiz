package com.ceylon.intellibiz.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A purchase request from the public marketplace checkout. There is no payment gateway connected yet
 * (see the Finance dashboard), so this is a lead for the sales team to follow up on, not a paid order —
 * closer in spirit to a ContactRequest than to the internal CRM {@link Order}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "marketplace_orders")
public class MarketplaceOrder {

    @Id
    private String id;

    /** The product this request is for (a products._id). Checked by the controller, since Mongo has no foreign keys. */
    @Indexed
    private String productId;

    // Snapshotted at request time so the record still makes sense if the product's title or price changes later.
    private String productTitle;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal unitPrice;

    private int quantity;

    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal totalAmount;

    private String buyerName;
    private String buyerEmail;
    private String buyerCompany;

    private String status = "Requested";

    @Indexed
    private Instant createdAt = Instant.now();
}
