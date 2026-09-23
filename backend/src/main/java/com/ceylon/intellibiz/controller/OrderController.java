package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.Order;
import com.ceylon.intellibiz.repository.CustomerRepository;
import com.ceylon.intellibiz.repository.OrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public OrderController(OrderRepository orderRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public List<Order> getAllOrders(@RequestParam(required = false) String status) {
        if (status == null || status.isBlank()) {
            return orderRepository.findAll();
        }
        return orderRepository.findByStatus(status);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable String id) {
        return orderRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody Order order) {
        ApiError problem = checkCustomer(order);
        if (problem != null) {
            return ResponseEntity.badRequest().body(problem);
        }
        order.setId(null);
        order.setCreatedAt(Instant.now());
        applyLineItemTotal(order);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable String id, @Valid @RequestBody Order update) {
        return orderRepository.findById(id)
            .<ResponseEntity<?>>map(existing -> {
                ApiError problem = checkCustomer(update);
                if (problem != null) {
                    return ResponseEntity.badRequest().body(problem);
                }
                existing.setOrderNumber(update.getOrderNumber());
                existing.setCustomerId(update.getCustomerId());
                existing.setChannel(update.getChannel());
                existing.setItems(update.getItems());
                existing.setTotalAmount(update.getTotalAmount());
                existing.setStatus(update.getStatus());
                applyLineItemTotal(existing);
                return ResponseEntity.ok(orderRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable String id) {
        if (!orderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        orderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Mongo has no foreign keys, so make sure the customer an order points at really exists. */
    private ApiError checkCustomer(Order order) {
        if (order.getCustomerId() != null && order.getCustomerId().isBlank()) {
            order.setCustomerId(null);
        }
        if (order.getCustomerId() != null && !customerRepository.existsById(order.getCustomerId())) {
            return new ApiError("customerId does not match any customer.");
        }
        return null;
    }

    /**
     * When line items are given, they're the source of truth for the total — a client-supplied total that
     * disagreed with its own line items would just be a bug (or a lie) sitting in the database. With no
     * line items, whatever total the client sent stands, so simple/manual orders keep working.
     */
    private void applyLineItemTotal(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return;
        }
        BigDecimal computed = order.getItems().stream()
            .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(computed);
    }
}
