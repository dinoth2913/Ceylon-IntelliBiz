package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.model.InventoryItem;
import com.ceylon.intellibiz.repository.InventoryItemRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryItemRepository inventoryItemRepository;

    public InventoryController(InventoryItemRepository inventoryItemRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @GetMapping
    public List<InventoryItem> getAllInventoryItems() {
        return inventoryItemRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItem> getInventoryItem(@PathVariable Long id) {
        return inventoryItemRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public InventoryItem createInventoryItem(@Valid @RequestBody InventoryItem item) {
        item.setId(null);
        item.setCreatedAt(Instant.now());
        return inventoryItemRepository.save(item);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> updateInventoryItem(@PathVariable Long id, @Valid @RequestBody InventoryItem update) {
        return inventoryItemRepository.findById(id)
            .map(existing -> {
                existing.setSku(update.getSku());
                existing.setName(update.getName());
                existing.setCategory(update.getCategory());
                existing.setWarehouse(update.getWarehouse());
                existing.setPrice(update.getPrice());
                existing.setStockQuantity(update.getStockQuantity());
                existing.setReorderLevel(update.getReorderLevel());
                return ResponseEntity.ok(inventoryItemRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable Long id) {
        if (!inventoryItemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        inventoryItemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
