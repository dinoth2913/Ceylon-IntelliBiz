package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.model.Vendor;
import com.ceylon.intellibiz.repository.VendorRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    private final VendorRepository vendorRepository;

    public VendorController(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @GetMapping
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vendor> getVendor(@PathVariable Long id) {
        return vendorRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Vendor createVendor(@Valid @RequestBody Vendor vendor) {
        vendor.setId(null);
        vendor.setCreatedAt(Instant.now());
        return vendorRepository.save(vendor);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendor> updateVendor(@PathVariable Long id, @Valid @RequestBody Vendor update) {
        return vendorRepository.findById(id)
            .map(existing -> {
                existing.setCompanyName(update.getCompanyName());
                existing.setContactName(update.getContactName());
                existing.setEmail(update.getEmail());
                existing.setPhone(update.getPhone());
                return ResponseEntity.ok(vendorRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        if (!vendorRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        vendorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
