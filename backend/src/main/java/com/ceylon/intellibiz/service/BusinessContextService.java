package com.ceylon.intellibiz.service;

import com.ceylon.intellibiz.dto.AiBusinessContext;
import com.ceylon.intellibiz.model.Invoice;
import com.ceylon.intellibiz.model.InventoryItem;
import com.ceylon.intellibiz.model.Order;
import com.ceylon.intellibiz.repository.CustomerRepository;
import com.ceylon.intellibiz.repository.InventoryItemRepository;
import com.ceylon.intellibiz.repository.InvoiceRepository;
import com.ceylon.intellibiz.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
public class BusinessContextService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public BusinessContextService(
        CustomerRepository customerRepository,
        OrderRepository orderRepository,
        InvoiceRepository invoiceRepository,
        InventoryItemRepository inventoryItemRepository
    ) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    public AiBusinessContext build() {
        return summarise(
            customerRepository.count(),
            orderRepository.findAll(),
            invoiceRepository.findAll(),
            inventoryItemRepository.findAll()
        );
    }

    static AiBusinessContext summarise(long customers, List<Order> orders, List<Invoice> invoices, List<InventoryItem> items) {
        int processing = 0, fulfilled = 0, pendingPayment = 0, cancelled = 0;
        double orderValue = 0, openValue = 0;
        for (Order order : orders) {
            double amount = amount(order.getTotalAmount());
            orderValue += amount;
            switch (normalise(order.getStatus())) {
                case "processing" -> { processing++; openValue += amount; }
                case "pending payment" -> { pendingPayment++; openValue += amount; }
                case "fulfilled" -> fulfilled++;
                case "cancelled" -> cancelled++;
                default -> { }
            }
        }

        int paid = 0, outstanding = 0, overdue = 0, draft = 0;
        double paidAmount = 0, outstandingAmount = 0, overdueAmount = 0, draftAmount = 0;
        for (Invoice invoice : invoices) {
            double amount = amount(invoice.getTotalAmount());
            switch (normalise(invoice.getStatus())) {
                case "paid" -> { paid++; paidAmount += amount; }
                case "outstanding" -> { outstanding++; outstandingAmount += amount; }
                case "overdue" -> { overdue++; overdueAmount += amount; }
                case "draft" -> { draft++; draftAmount += amount; }
                default -> { }
            }
        }

        List<AiBusinessContext.LowStockItem> lowStock = items.stream()
            .filter(item -> stock(item) <= reorderLevel(item))
            .sorted(Comparator.comparingDouble(item -> (double) stock(item) / Math.max(reorderLevel(item), 1)))
            .map(item -> new AiBusinessContext.LowStockItem(item.getName(), stock(item), reorderLevel(item)))
            .toList();

        return new AiBusinessContext(
            (int) customers,
            new AiBusinessContext.Orders(orders.size(), processing, fulfilled, pendingPayment, cancelled, orderValue, openValue),
            new AiBusinessContext.Invoices(
                invoices.size(), paid, outstanding, overdue, draft, paidAmount, outstandingAmount, overdueAmount, draftAmount),
            new AiBusinessContext.Inventory(items.size(), lowStock)
        );
    }

    private static String normalise(String status) {
        return status == null ? "" : status.trim().toLowerCase();
    }

    private static double amount(BigDecimal value) {
        return value == null ? 0 : value.doubleValue();
    }

    private static int stock(InventoryItem item) {
        return item.getStockQuantity() == null ? 0 : item.getStockQuantity();
    }

    private static int reorderLevel(InventoryItem item) {
        return item.getReorderLevel() == null ? 0 : item.getReorderLevel();
    }
}
