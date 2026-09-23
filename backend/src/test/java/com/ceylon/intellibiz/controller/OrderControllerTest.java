package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.ceylon.intellibiz.model.Order;
import com.ceylon.intellibiz.model.OrderLineItem;
import com.ceylon.intellibiz.repository.CustomerRepository;
import com.ceylon.intellibiz.repository.OrderRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class OrderControllerTest {

    static OrderRepository fakeOrderRepository(List<Order> store) {
        return (OrderRepository) Proxy.newProxyInstance(
            OrderControllerTest.class.getClassLoader(),
            new Class<?>[] {OrderRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Order order = (Order) args[0];
                    if (order.getId() == null) {
                        order.setId(String.valueOf(store.size() + 1));
                    }
                    store.removeIf(existing -> existing.getId().equals(order.getId()));
                    store.add(order);
                    yield order;
                }
                case "findById" -> store.stream().filter(o -> o.getId().equals(args[0])).findFirst();
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeOrderRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static CustomerRepository fakeCustomerRepository() {
        return (CustomerRepository) Proxy.newProxyInstance(
            OrderControllerTest.class.getClassLoader(),
            new Class<?>[] {CustomerRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "existsById" -> true;
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeCustomerRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Order> orders = new ArrayList<>();
    private OrderController controller;

    @BeforeEach
    void setUp() {
        orders.clear();
        controller = new OrderController(fakeOrderRepository(orders), fakeCustomerRepository());
    }

    private static Order newOrder(String orderNumber, BigDecimal totalAmount) {
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setTotalAmount(totalAmount);
        return order;
    }

    private static OrderLineItem lineItem(String description, int quantity, String unitPrice) {
        return new OrderLineItem(description, quantity, new BigDecimal(unitPrice));
    }

    @Test
    void aNewOrderDefaultsToDirectSalesWithNoLineItems() {
        ResponseEntity<?> response = controller.createOrder(newOrder("ORD-1", new BigDecimal("100")));

        Order saved = (Order) response.getBody();
        assertNotNull(saved);
        assertEquals("Direct sales", saved.getChannel());
        assertEquals(List.of(), saved.getItems());
        assertEquals(new BigDecimal("100"), saved.getTotalAmount());
    }

    @Test
    void withNoLineItemsTheClientsTotalIsTrusted() {
        Order order = newOrder("ORD-1", new BigDecimal("250"));

        ResponseEntity<?> response = controller.createOrder(order);

        assertEquals(new BigDecimal("250"), ((Order) response.getBody()).getTotalAmount());
    }

    @Test
    void withLineItemsTheTotalIsComputedFromThemNotTrustedFromTheClient() {
        Order order = newOrder("ORD-1", new BigDecimal("1")); // deliberately wrong — should be overwritten
        order.setItems(List.of(
            lineItem("Widget", 3, "10.00"),
            lineItem("Installation", 1, "25.50")
        ));

        ResponseEntity<?> response = controller.createOrder(order);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Order saved = (Order) response.getBody();
        assertEquals(new BigDecimal("55.50"), saved.getTotalAmount());
    }

    @Test
    void updatingLineItemsRecomputesTheTotal() {
        Order saved = (Order) controller.createOrder(newOrder("ORD-1", new BigDecimal("100"))).getBody();

        Order update = newOrder("ORD-1", new BigDecimal("999"));
        update.setItems(List.of(lineItem("Widget", 2, "20")));
        ResponseEntity<?> response = controller.updateOrder(saved.getId(), update);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(new BigDecimal("40"), ((Order) response.getBody()).getTotalAmount());
    }

    @Test
    void channelCanBeSetAndChanged() {
        Order order = newOrder("ORD-1", new BigDecimal("100"));
        order.setChannel("Marketplace");
        Order saved = (Order) controller.createOrder(order).getBody();
        assertEquals("Marketplace", saved.getChannel());

        Order update = newOrder("ORD-1", new BigDecimal("100"));
        update.setChannel("Field agent");
        ResponseEntity<?> response = controller.updateOrder(saved.getId(), update);
        assertEquals("Field agent", ((Order) response.getBody()).getChannel());
    }
}
