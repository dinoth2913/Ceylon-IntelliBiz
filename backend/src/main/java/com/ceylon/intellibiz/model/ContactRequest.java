package com.ceylon.intellibiz.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "contact_requests")
public class ContactRequest {

    public static final Set<String> STATUSES = new LinkedHashSet<>(List.of("New", "In Progress", "Resolved", "Closed"));

    @Id
    private String id;

    private String name;

    private String email;

    private String company;

    private String message;

    private String status = "New";

    @Indexed
    private Instant createdAt = Instant.now();
}
