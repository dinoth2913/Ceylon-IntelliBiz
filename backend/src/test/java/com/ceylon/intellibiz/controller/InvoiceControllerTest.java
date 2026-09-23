package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.ceylon.intellibiz.model.Invoice;
import com.ceylon.intellibiz.repository.CustomerRepository;
import com.ceylon.intellibiz.repository.InvoiceRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class InvoiceControllerTest {

    static InvoiceRepository fakeInvoiceRepository(List<Invoice> store) {
        return (InvoiceRepository) Proxy.newProxyInstance(
            InvoiceControllerTest.class.getClassLoader(),
            new Class<?>[] {InvoiceRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Invoice invoice = (Invoice) args[0];
                    if (invoice.getId() == null) {
                        invoice.setId(String.valueOf(store.size() + 1));
                    }
                    store.removeIf(existing -> existing.getId().equals(invoice.getId()));
                    store.add(invoice);
                    yield invoice;
                }
                case "findById" -> store.stream().filter(i -> i.getId().equals(args[0])).findFirst();
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeInvoiceRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static CustomerRepository fakeCustomerRepository() {
        return (CustomerRepository) Proxy.newProxyInstance(
            InvoiceControllerTest.class.getClassLoader(),
            new Class<?>[] {CustomerRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "existsById" -> true;
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeCustomerRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Invoice> invoices = new ArrayList<>();
    private InvoiceController controller;

    @BeforeEach
    void setUp() {
        invoices.clear();
        controller = new InvoiceController(fakeInvoiceRepository(invoices), fakeCustomerRepository());
    }

    private static Invoice newInvoice(String invoiceNumber) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setTotalAmount(new BigDecimal("100"));
        return invoice;
    }

    @Test
    void dueDateIsNullWhenNotProvided() {
        ResponseEntity<?> response = controller.createInvoice(newInvoice("INV-1"));

        assertNull(((Invoice) response.getBody()).getDueDate());
    }

    @Test
    void dueDateRoundTripsThroughCreate() {
        Invoice invoice = newInvoice("INV-1");
        Instant due = Instant.now().plus(30, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        invoice.setDueDate(due);

        ResponseEntity<?> response = controller.createInvoice(invoice);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(due, ((Invoice) response.getBody()).getDueDate());
    }

    @Test
    void dueDateCanBeSetOnUpdate() {
        Invoice saved = (Invoice) controller.createInvoice(newInvoice("INV-1")).getBody();
        assertNotNull(saved);

        Instant due = Instant.now().plus(14, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        Invoice update = newInvoice("INV-1");
        update.setDueDate(due);

        ResponseEntity<?> response = controller.updateInvoice(saved.getId(), update);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(due, ((Invoice) response.getBody()).getDueDate());
    }
}
