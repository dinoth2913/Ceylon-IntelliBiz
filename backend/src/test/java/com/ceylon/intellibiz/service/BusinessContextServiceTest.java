package com.ceylon.intellibiz.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ceylon.intellibiz.dto.AiBusinessContext;
import com.ceylon.intellibiz.model.InventoryItem;
import com.ceylon.intellibiz.model.Invoice;
import com.ceylon.intellibiz.model.Order;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class BusinessContextServiceTest {

    private static Order order(String status, String amount) {
        Order order = new Order();
        order.setStatus(status);
        order.setTotalAmount(new BigDecimal(amount));
        return order;
    }

    private static Invoice invoice(String status, String amount) {
        Invoice invoice = new Invoice();
        invoice.setStatus(status);
        invoice.setTotalAmount(new BigDecimal(amount));
        return invoice;
    }

    private static InventoryItem item(String name, Integer stock, Integer reorderLevel) {
        InventoryItem item = new InventoryItem();
        item.setName(name);
        item.setStockQuantity(stock);
        item.setReorderLevel(reorderLevel);
        return item;
    }

    @Test
    void summarisesOrdersByStatusAndTracksOpenValue() {
        AiBusinessContext context = BusinessContextService.summarise(
            3,
            List.of(
                order("Processing", "100"),
                order("Pending payment", "50"),
                order("Fulfilled", "200"),
                order("cancelled", "25"),
                order("Something else", "5")),
            List.of(),
            List.of());

        AiBusinessContext.Orders orders = context.orders();
        assertEquals(3, context.customers());
        assertEquals(5, orders.total());
        assertEquals(1, orders.processing());
        assertEquals(1, orders.pendingPayment());
        assertEquals(1, orders.fulfilled());
        assertEquals(1, orders.cancelled());
        assertEquals(380.0, orders.value());
        assertEquals(150.0, orders.openValue());
    }

    @Test
    void summarisesInvoicesByStatus() {
        AiBusinessContext.Invoices invoices = BusinessContextService.summarise(
            0,
            List.of(),
            List.of(invoice("Paid", "10"), invoice("Paid", "5"), invoice("Overdue", "7"), invoice("Draft", "3"), invoice("Outstanding", "1")),
            List.of()).invoices();

        assertEquals(5, invoices.total());
        assertEquals(2, invoices.paid());
        assertEquals(15.0, invoices.paidAmount());
        assertEquals(1, invoices.overdue());
        assertEquals(7.0, invoices.overdueAmount());
        assertEquals(1, invoices.draft());
        assertEquals(3.0, invoices.draftAmount());
        assertEquals(1, invoices.outstanding());
        assertEquals(1.0, invoices.outstandingAmount());
    }

    @Test
    void flagsLowStockWorstFirstAndToleratesNulls() {
        AiBusinessContext.Inventory inventory = BusinessContextService.summarise(
            0,
            List.of(),
            List.of(),
            List.of(
                item("Healthy", 100, 10),
                item("Nearly out", 9, 10),
                item("Critical", 1, 10),
                item("At level", 10, 10),
                item("Unset", null, null))).inventory();

        assertEquals(5, inventory.skus());
        List<String> names = inventory.lowStock().stream().map(AiBusinessContext.LowStockItem::name).toList();
        assertEquals(List.of("Unset", "Critical", "Nearly out", "At level"), names);
        assertTrue(names.stream().noneMatch("Healthy"::equals));
    }

    @Test
    void handlesAnEmptyWorkspace() {
        AiBusinessContext context = BusinessContextService.summarise(0, List.of(), List.of(), List.of());
        assertEquals(0, context.orders().total());
        assertEquals(0, context.invoices().total());
        assertEquals(0, context.inventory().skus());
        assertTrue(context.inventory().lowStock().isEmpty());
    }
}
