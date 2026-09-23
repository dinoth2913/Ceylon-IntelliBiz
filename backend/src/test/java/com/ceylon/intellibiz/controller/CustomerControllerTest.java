package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.Customer;
import com.ceylon.intellibiz.repository.CustomerRepository;
import com.ceylon.intellibiz.repository.InvoiceRepository;
import com.ceylon.intellibiz.repository.OrderRepository;
import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class CustomerControllerTest {

    static CustomerRepository fakeCustomerRepository(List<Customer> store) {
        return (CustomerRepository) Proxy.newProxyInstance(
            CustomerControllerTest.class.getClassLoader(),
            new Class<?>[] {CustomerRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Customer customer = (Customer) args[0];
                    if (customer.getId() == null) {
                        customer.setId(String.valueOf(store.size() + 1));
                    }
                    store.removeIf(existing -> existing.getId().equals(customer.getId()));
                    store.add(customer);
                    yield customer;
                }
                case "findById" -> store.stream().filter(c -> c.getId().equals(args[0])).findFirst();
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeCustomerRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static OrderRepository fakeOrderRepository() {
        return (OrderRepository) Proxy.newProxyInstance(
            CustomerControllerTest.class.getClassLoader(),
            new Class<?>[] {OrderRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "existsByCustomerId" -> false;
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeOrderRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static InvoiceRepository fakeInvoiceRepository() {
        return (InvoiceRepository) Proxy.newProxyInstance(
            CustomerControllerTest.class.getClassLoader(),
            new Class<?>[] {InvoiceRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "existsByCustomerId" -> false;
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeInvoiceRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Customer> customers = new ArrayList<>();
    private CustomerController controller;

    @BeforeEach
    void setUp() {
        customers.clear();
        controller = new CustomerController(fakeCustomerRepository(customers), fakeOrderRepository(), fakeInvoiceRepository());
    }

    private static Customer newCustomer(String name) {
        Customer customer = new Customer();
        customer.setFullName(name);
        return customer;
    }

    @Test
    void aNewCustomerDefaultsToTheSmeSegment() {
        ResponseEntity<?> response = controller.createCustomer(newCustomer("Asha"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Customer saved = (Customer) response.getBody();
        assertNotNull(saved);
        assertEquals("SME", saved.getSegment());
    }

    @Test
    void anInvalidSegmentIsRejected() {
        Customer customer = newCustomer("Asha");
        customer.setSegment("VIP");

        ResponseEntity<?> response = controller.createCustomer(customer);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("segment must be one of: Enterprise, SME, Retail", ((ApiError) response.getBody()).getMessage());
        assertEquals(0, customers.size());
    }

    @Test
    void aValidSegmentIsAccepted() {
        Customer customer = newCustomer("Asha");
        customer.setSegment("Enterprise");

        ResponseEntity<?> response = controller.createCustomer(customer);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Enterprise", ((Customer) response.getBody()).getSegment());
    }

    @Test
    void updatingCanChangeTheSegment() {
        Customer saved = (Customer) controller.createCustomer(newCustomer("Asha")).getBody();

        Customer update = newCustomer("Asha");
        update.setSegment("Retail");
        ResponseEntity<?> response = controller.updateCustomer(saved.getId(), update);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Retail", ((Customer) response.getBody()).getSegment());
    }

    @Test
    void updatingWithAnInvalidSegmentIsRejectedAndLeavesTheRecordAlone() {
        Customer saved = (Customer) controller.createCustomer(newCustomer("Asha")).getBody();

        Customer update = newCustomer("Asha");
        update.setSegment("VIP");
        ResponseEntity<?> response = controller.updateCustomer(saved.getId(), update);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("SME", customers.get(0).getSegment());
    }
}
