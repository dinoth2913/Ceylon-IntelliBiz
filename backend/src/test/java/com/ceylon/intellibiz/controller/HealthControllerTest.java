package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class HealthControllerTest {

    @Test
    void healthReturnsExpectedMessage() {
        HealthController controller = new HealthController();

        String response = controller.health();

        assertEquals("Ceylon IntelliBiz API is running", response);
    }
}
