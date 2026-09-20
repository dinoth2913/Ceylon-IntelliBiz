package com.ceylon.intellibiz.repository;

import com.ceylon.intellibiz.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends MongoRepository<Customer, String> {
    List<Customer> findByFullNameContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(String fullName, String companyName);
}
