package com.ceylon.intellibiz.dto;

import java.util.List;

/** Snapshot of a workspace sent to the AI service so it can answer with real numbers. */
public record AiBusinessContext(int customers, Orders orders, Invoices invoices, Inventory inventory) {

    public record Orders(
        int total, int processing, int fulfilled, int pendingPayment, int cancelled, double value, double openValue) {
    }

    public record Invoices(
        int total, int paid, int outstanding, int overdue, int draft,
        double paidAmount, double outstandingAmount, double overdueAmount, double draftAmount) {
    }

    public record LowStockItem(String name, int stock, int reorderLevel) {
    }

    public record Inventory(int skus, List<LowStockItem> lowStock) {
    }
}
