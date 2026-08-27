package com.ceylon.intellibiz.repository;

import com.ceylon.intellibiz.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByFullNameContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(String fullName, String companyName);
}
