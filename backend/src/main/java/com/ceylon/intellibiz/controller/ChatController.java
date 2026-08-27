package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.model.ChatMessage;
import com.ceylon.intellibiz.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @GetMapping("/{sessionId}")
    public List<ChatMessage> getChatHistory(@PathVariable String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @PostMapping
    public Map<String, Object> sendMessage(@RequestBody ChatMessage userMessage) {
        // Save the user message
        userMessage.setRole("user");
        userMessage.setCreatedAt(Instant.now());
        chatMessageRepository.save(userMessage);

        // Generate a simulated AI response
        String aiContent = generateAiResponse(userMessage.getContent());

        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setSessionId(userMessage.getSessionId());
        aiMessage.setRole("assistant");
        aiMessage.setContent(aiContent);
        aiMessage.setCreatedAt(Instant.now());
        chatMessageRepository.save(aiMessage);

        return Map.of(
            "userMessage", userMessage,
            "aiMessage", aiMessage
        );
    }

    private String generateAiResponse(String userInput) {
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
