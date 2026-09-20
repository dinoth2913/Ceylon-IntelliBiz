package com.ceylon.intellibiz.service;

import com.ceylon.intellibiz.dto.AiBusinessContext;
import com.ceylon.intellibiz.dto.AiChatReply;
import com.ceylon.intellibiz.dto.AiInsight;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Optional;

/** Thin client for the Python AI service. Every call returns empty when the service is unavailable. */
@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final RestClient restClient;

    @Autowired
    public AiServiceClient(RestClient.Builder builder, @Value("${ai.service.url}") String baseUrl) {
        this(builder.baseUrl(baseUrl).requestFactory(withTimeouts()).build());
    }

    public AiServiceClient(RestClient restClient) {
        this.restClient = restClient;
    }

    private static SimpleClientHttpRequestFactory withTimeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2_000);
        factory.setReadTimeout(5_000);
        return factory;
    }

    public Optional<AiChatReply> chat(String message, String sessionId, AiBusinessContext context) {
        try {
            AiChatReply reply = restClient.post()
                .uri("/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ChatRequest(message, sessionId, context))
                .retrieve()
                .body(AiChatReply.class);
            return Optional.ofNullable(reply).filter(r -> r.reply() != null && !r.reply().isBlank());
        } catch (RestClientException e) {
            log.warn("AI service chat call failed, using built-in fallback: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<List<AiInsight>> insights(AiBusinessContext context) {
        try {
            List<AiInsight> insights = restClient.post()
                .uri("/insights")
                .contentType(MediaType.APPLICATION_JSON)
                .body(context)
                .retrieve()
                .body(new ParameterizedTypeReference<List<AiInsight>>() { });
            return Optional.ofNullable(insights);
        } catch (RestClientException e) {
            log.warn("AI service insights call failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public record ChatRequest(String message, String sessionId, AiBusinessContext context) {
    }
}
