package com.ceylon.intellibiz.repository;

import com.ceylon.intellibiz.model.InventoryItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryItemRepository extends MongoRepository<InventoryItem, String> {
}
