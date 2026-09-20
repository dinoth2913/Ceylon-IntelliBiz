package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.AiBusinessContext;
import com.ceylon.intellibiz.dto.AiChatReply;
import com.ceylon.intellibiz.model.ChatMessage;
import com.ceylon.intellibiz.repository.ChatMessageRepository;
import com.ceylon.intellibiz.security.Roles;
import com.ceylon.intellibiz.service.AiServiceClient;
import com.ceylon.intellibiz.service.BusinessContextService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    static final int MAX_MESSAGE_LENGTH = 2000;

    private final ChatMessageRepository chatMessageRepository;
    private final AiServiceClient aiServiceClient;
    private final BusinessContextService businessContextService;

    public ChatController(
        ChatMessageRepository chatMessageRepository,
        AiServiceClient aiServiceClient,
        BusinessContextService businessContextService
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.aiServiceClient = aiServiceClient;
        this.businessContextService = businessContextService;
    }

    @GetMapping("/{sessionId}")
    public List<ChatMessage> getChatHistory(@PathVariable String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    /**
     * The chat endpoint is public so marketplace visitors can use the widget, but only users with a
     * business role (admin, sales, finance) get answers grounded in workspace data. {@code authentication}
     * is null for anonymous callers, and a signed-in user without a business role is treated like one.
     */
    @PostMapping
    public Map<String, Object> sendMessage(@RequestBody ChatMessage userMessage, Authentication authentication) {
        String content = userMessage.getContent() == null ? "" : userMessage.getContent().trim();
        if (content.isEmpty() || content.length() > MAX_MESSAGE_LENGTH) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Message must be between 1 and " + MAX_MESSAGE_LENGTH + " characters");
        }

        userMessage.setId(null);
        userMessage.setContent(content);
        userMessage.setRole("user");
        userMessage.setCreatedAt(Instant.now());
        chatMessageRepository.save(userMessage);

        AiBusinessContext context = Roles.hasBusinessAccess(authentication) ? businessContextService.build() : null;
        Optional<AiChatReply> aiReply = aiServiceClient.chat(content, userMessage.getSessionId(), context);

        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setSessionId(userMessage.getSessionId());
        aiMessage.setRole("assistant");
        aiMessage.setContent(aiReply.map(AiChatReply::reply).orElseGet(() -> generateFallbackResponse(content)));
        aiMessage.setCreatedAt(Instant.now());
        chatMessageRepository.save(aiMessage);

        return Map.of(
            "userMessage", userMessage,
            "aiMessage", aiMessage,
            "intent", aiReply.map(AiChatReply::intent).orElse("fallback"),
            "suggestions", aiReply.map(AiChatReply::suggestions).orElse(List.of())
        );
    }

    /** Used only when the AI service is unreachable, so the chat never just errors out. */
    private String generateFallbackResponse(String userInput) {
        String input = userInput.toLowerCase();

        if (input.contains("crm") || input.contains("customer")) {
            return "Our CRM module helps you manage customer relationships, track leads, and automate follow-ups. Would you like to learn about specific CRM features?";
        } else if (input.contains("erp") || input.contains("inventory") || input.contains("finance")) {
            return "Ceylon IntelliBiz ERP covers inventory management, financial reporting, procurement, and HR — all integrated into one dashboard. What area interests you most?";
        } else if (input.contains("marketplace") || input.contains("product") || input.contains("vendor")) {
            return "Our Marketplace module supports vendor onboarding, catalog management, order tracking, and secure payments. Shall I walk you through the vendor workflow?";
        } else if (input.contains("ai") || input.contains("forecast") || input.contains("predict")) {
            return "Our AI services include sales forecasting, demand prediction, customer churn analysis, and intelligent business recommendations powered by machine learning.";
        } else if (input.contains("price") || input.contains("cost") || input.contains("plan")) {
            return "Ceylon IntelliBiz offers flexible pricing designed for Sri Lankan businesses — from startups to large enterprises. Contact our sales team for a tailored quote.";
        } else if (input.contains("help") || input.contains("support")) {
            return "I can help you with CRM, ERP, Marketplace, AI features, pricing, and technical support. What would you like to know about?";
        } else {
            return "Thank you for your message! I can help you explore our CRM, ERP, Marketplace, and AI capabilities. What area of your business would you like to improve?";
        }
    }
}
