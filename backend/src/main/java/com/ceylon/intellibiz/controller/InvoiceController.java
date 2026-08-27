package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.model.Invoice;
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

    public InvoiceController(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping
    public List<Invoice> getAllInvoices(@RequestParam(required = false) String status) {
        if (status == null || status.isBlank()) {
            return invoiceRepository.findAll();
        }
        return invoiceRepository.findByStatus(status);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long id) {
        return invoiceRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Invoice createInvoice(@Valid @RequestBody Invoice invoice) {
        invoice.setId(null);
        invoice.setCreatedAt(Instant.now());
        return invoiceRepository.save(invoice);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, @Valid @RequestBody Invoice update) {
        return invoiceRepository.findById(id)
            .map(existing -> {
                existing.setInvoiceNumber(update.getInvoiceNumber());
                existing.setCustomerId(update.getCustomerId());
                existing.setTotalAmount(update.getTotalAmount());
                existing.setStatus(update.getStatus());
                return ResponseEntity.ok(invoiceRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        if (!invoiceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        invoiceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
