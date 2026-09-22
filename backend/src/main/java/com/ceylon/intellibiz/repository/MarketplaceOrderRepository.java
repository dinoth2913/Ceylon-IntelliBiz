package com.ceylon.intellibiz.repository;

import com.ceylon.intellibiz.model.MarketplaceOrder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplaceOrderRepository extends MongoRepository<MarketplaceOrder, String> {
    List<MarketplaceOrder> findAllByOrderByCreatedAtDesc();

    boolean existsByProductId(String productId);
}
