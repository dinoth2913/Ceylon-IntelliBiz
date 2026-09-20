package com.ceylon.intellibiz.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.ceylon.intellibiz.dto.AiBusinessContext;
import com.ceylon.intellibiz.dto.AiChatReply;
import com.ceylon.intellibiz.dto.AiInsight;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AiServiceClientTest {

    private MockRestServiceServer server;
    private AiServiceClient client;

    private static final AiBusinessContext CONTEXT = new AiBusinessContext(
        4,
        new AiBusinessContext.Orders(2, 1, 1, 0, 0, 300.0, 100.0),
        new AiBusinessContext.Invoices(0, 0, 0, 0, 0, 0, 0, 0, 0),
        new AiBusinessContext.Inventory(1, List.of(new AiBusinessContext.LowStockItem("Pallet", 8, 25))));

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new AiServiceClient(builder.baseUrl("http://ai").build());
    }

    @Test
    void chatSendsCamelCaseContextAndParsesTheReply() {
        server.expect(requestTo("http://ai/chat"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(jsonPath("$.message").value("what should I reorder?"))
            .andExpect(jsonPath("$.sessionId").value("abc"))
            .andExpect(jsonPath("$.context.customers").value(4))
            .andExpect(jsonPath("$.context.orders.openValue").value(100.0))
            .andExpect(jsonPath("$.context.inventory.lowStock[0].reorderLevel").value(25))
            .andRespond(withSuccess(
                "{\"reply\":\"Reorder pallets\",\"intent\":\"inventory\",\"suggestions\":[\"More?\"]}",
                MediaType.APPLICATION_JSON));

        Optional<AiChatReply> reply = client.chat("what should I reorder?", "abc", CONTEXT);

        assertTrue(reply.isPresent());
        assertEquals("Reorder pallets", reply.get().reply());
        assertEquals("inventory", reply.get().intent());
        assertEquals(List.of("More?"), reply.get().suggestions());
        server.verify();
    }

    @Test
    void chatSendsNullContextForAnonymousCallers() {
        server.expect(requestTo("http://ai/chat"))
            .andExpect(jsonPath("$.context").doesNotExist())
            .andRespond(withSuccess("{\"reply\":\"Hi\",\"intent\":\"greeting\"}", MediaType.APPLICATION_JSON));

        Optional<AiChatReply> reply = client.chat("hello", "abc", null);

        assertTrue(reply.isPresent());
        assertTrue(reply.get().suggestions().isEmpty());
        server.verify();
    }

    @Test
    void chatReturnsEmptyWhenTheServiceFails() {
        server.expect(requestTo("http://ai/chat")).andRespond(withServerError());
        assertTrue(client.chat("hello", "abc", null).isEmpty());
    }

    @Test
    void chatReturnsEmptyWhenTheReplyIsBlank() {
        server.expect(requestTo("http://ai/chat"))
            .andRespond(withSuccess("{\"reply\":\"  \",\"intent\":\"x\"}", MediaType.APPLICATION_JSON));
        assertTrue(client.chat("hello", "abc", null).isEmpty());
    }

    @Test
    void insightsParsesTheList() {
        server.expect(requestTo("http://ai/insights"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(jsonPath("$.inventory.skus").value(1))
            .andRespond(withSuccess(
                "[{\"id\":\"AI-1\",\"title\":\"T\",\"description\":\"D\",\"confidence\":100,\"category\":\"Risk\"}]",
                MediaType.APPLICATION_JSON));

        Optional<List<AiInsight>> insights = client.insights(CONTEXT);

        assertTrue(insights.isPresent());
        assertEquals(new AiInsight("AI-1", "T", "D", 100, "Risk"), insights.get().get(0));
        server.verify();
    }

    @Test
    void insightsReturnsEmptyWhenTheServiceFails() {
        server.expect(requestTo("http://ai/insights")).andRespond(withServerError());
        assertTrue(client.insights(CONTEXT).isEmpty());
    }
}
