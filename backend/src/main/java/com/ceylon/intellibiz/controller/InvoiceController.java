package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.Invoice;
import com.ceylon.intellibiz.repository.CustomerRepository;
import com.ceylon.intellibiz.repository.InvoiceRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;

    public InvoiceController(InvoiceRepository invoiceRepository, CustomerRepository customerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public List<Invoice> getAllInvoices(@RequestParam(required = false) String status) {
        if (status == null || status.isBlank()) {
            return invoiceRepository.findAll();
        }
        return invoiceRepository.findByStatus(status);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable String id) {
        return invoiceRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createInvoice(@Valid @RequestBody Invoice invoice) {
        ApiError problem = checkCustomer(invoice);
        if (problem != null) {
            return ResponseEntity.badRequest().body(problem);
        }
        invoice.setId(null);
        invoice.setCreatedAt(Instant.now());
        return ResponseEntity.ok(invoiceRepository.save(invoice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvoice(@PathVariable String id, @Valid @RequestBody Invoice update) {
        return invoiceRepository.findById(id)
            .<ResponseEntity<?>>map(existing -> {
                ApiError problem = checkCustomer(update);
                if (problem != null) {
                    return ResponseEntity.badRequest().body(problem);
                }
                existing.setInvoiceNumber(update.getInvoiceNumber());
                existing.setCustomerId(update.getCustomerId());
                existing.setTotalAmount(update.getTotalAmount());
                existing.setStatus(update.getStatus());
                return ResponseEntity.ok(invoiceRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable String id) {
        if (!invoiceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        invoiceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Mongo has no foreign keys, so make sure the customer an invoice points at really exists. */
    private ApiError checkCustomer(Invoice invoice) {
        if (invoice.getCustomerId() != null && invoice.getCustomerId().isBlank()) {
            invoice.setCustomerId(null);
        }
        if (invoice.getCustomerId() != null && !customerRepository.existsById(invoice.getCustomerId())) {
            return new ApiError("customerId does not match any customer.");
        }
        return null;
    }
}
