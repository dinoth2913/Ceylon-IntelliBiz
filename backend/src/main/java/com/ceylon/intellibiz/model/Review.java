package com.ceylon.intellibiz.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reviews")
public class Review {

    @Id
    private String id;

    // Already indexed by database/mongo-init.js (reviews.createIndex({ productId: 1 })), so it's
    // not re-declared with @Indexed here — Spring Data's auto-generated index name would conflict.
    private String productId;

    // Set by ReviewController from the signed-in user, never trusted from the request body,
    // so nobody can post a review under someone else's name.
    private String userName;

    private int rating;
    private String comment;
    private Instant createdAt = Instant.now();
}
