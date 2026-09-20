package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.Customer;
import com.ceylon.intellibiz.repository.CustomerRepository;
import com.ceylon.intellibiz.repository.InvoiceRepository;
import com.ceylon.intellibiz.repository.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;

    public CustomerController(
        CustomerRepository customerRepository,
        OrderRepository orderRepository,
        InvoiceRepository invoiceRepository
    ) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping
    public List<Customer> getAllCustomers(@RequestParam(required = false) String search) {
        if (search == null || search.isBlank()) {
            return customerRepository.findAll();
        }
        return customerRepository.findByFullNameContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(search, search);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomer(@PathVariable String id) {
        return customerRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Customer createCustomer(@Valid @RequestBody Customer customer) {
        customer.setId(null);
        customer.setCreatedAt(Instant.now());
        return customerRepository.save(customer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable String id, @Valid @RequestBody Customer update) {
        return customerRepository.findById(id)
            .map(existing -> {
                existing.setFullName(update.getFullName());
                existing.setCompanyName(update.getCompanyName());
                existing.setEmail(update.getEmail());
                existing.setPhone(update.getPhone());
                return ResponseEntity.ok(customerRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Mongo has no foreign keys, so refuse to leave orders or invoices pointing at a customer that no longer exists. */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable String id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        if (orderRepository.existsByCustomerId(id) || invoiceRepository.existsByCustomerId(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError("This customer has orders or invoices, so it can't be deleted."));
        }
        customerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
