package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.MarketplaceOrderRequest;
import com.ceylon.intellibiz.model.MarketplaceOrder;
import com.ceylon.intellibiz.model.Product;
import com.ceylon.intellibiz.repository.MarketplaceOrderRepository;
import com.ceylon.intellibiz.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Public marketplace checkout. There is no payment gateway connected (see the Finance dashboard), so this
 * files a purchase request for the sales team to follow up on rather than actually charging anyone.
 */
@RestController
@RequestMapping("/api/marketplace-orders")
public class MarketplaceOrderController {

    private final MarketplaceOrderRepository marketplaceOrderRepository;
    private final ProductRepository productRepository;

    public MarketplaceOrderController(
        MarketplaceOrderRepository marketplaceOrderRepository,
        ProductRepository productRepository
    ) {
        this.marketplaceOrderRepository = marketplaceOrderRepository;
        this.productRepository = productRepository;
    }

    /** Public: anyone browsing the marketplace can request a purchase. Listing them is restricted to sales/admin. */
    @PostMapping
    public ResponseEntity<?> submit(@Valid @RequestBody MarketplaceOrderRequest form) {
        Optional<Product> productLookup = productRepository.findById(form.productId());
        if (productLookup.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiError("productId does not match any product."));
        }
        Product product = productLookup.get();

        MarketplaceOrder order = new MarketplaceOrder();
        order.setProductId(product.getId());
        order.setProductTitle(product.getTitle());
        order.setUnitPrice(product.getPrice());
        order.setQuantity(form.quantity());
        order.setTotalAmount(product.getPrice().multiply(BigDecimal.valueOf(form.quantity())));
        order.setBuyerName(form.buyerName().trim());
        order.setBuyerEmail(form.buyerEmail().trim());
        order.setBuyerCompany(form.buyerCompany() == null || form.buyerCompany().isBlank() ? null : form.buyerCompany().trim());
        order.setStatus("Requested");
        order.setCreatedAt(Instant.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(marketplaceOrderRepository.save(order));
    }

    @GetMapping
    public List<MarketplaceOrder> list() {
        return marketplaceOrderRepository.findAllByOrderByCreatedAtDesc();
    }
}
