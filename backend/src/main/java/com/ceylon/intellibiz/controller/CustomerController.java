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
    public ResponseEntity<?> createCustomer(@Valid @RequestBody Customer customer) {
        ApiError problem = checkSegment(customer);
        if (problem != null) {
            return ResponseEntity.badRequest().body(problem);
        }
        customer.setId(null);
        customer.setCreatedAt(Instant.now());
        return ResponseEntity.ok(customerRepository.save(customer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable String id, @Valid @RequestBody Customer update) {
        ApiError problem = checkSegment(update);
        if (problem != null) {
            return ResponseEntity.badRequest().body(problem);
        }
        return customerRepository.findById(id)
            .<ResponseEntity<?>>map(existing -> {
                existing.setFullName(update.getFullName());
                existing.setCompanyName(update.getCompanyName());
                existing.setEmail(update.getEmail());
                existing.setPhone(update.getPhone());
                existing.setSegment(update.getSegment());
                return ResponseEntity.ok(customerRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private static ApiError checkSegment(Customer customer) {
        if (customer.getSegment() != null && !Customer.SEGMENTS.contains(customer.getSegment())) {
            return new ApiError("segment must be one of: " + String.join(", ", Customer.SEGMENTS));
        }
        return null;
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
