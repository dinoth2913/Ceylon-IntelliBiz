package com.ceylon.intellibiz.repository;

import com.ceylon.intellibiz.model.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    List<Invoice> findByStatus(String status);

    boolean existsByCustomerId(String customerId);
}
