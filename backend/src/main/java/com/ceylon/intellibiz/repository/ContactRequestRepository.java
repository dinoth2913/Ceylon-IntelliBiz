package com.ceylon.intellibiz.repository;

import com.ceylon.intellibiz.model.ContactRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRequestRepository extends MongoRepository<ContactRequest, String> {
    List<ContactRequest> findAllByOrderByCreatedAtDesc();
}
