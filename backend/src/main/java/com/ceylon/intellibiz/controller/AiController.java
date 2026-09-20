package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.AiInsight;
import com.ceylon.intellibiz.service.AiServiceClient;
import com.ceylon.intellibiz.service.BusinessContextService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiServiceClient aiServiceClient;
    private final BusinessContextService businessContextService;

    public AiController(AiServiceClient aiServiceClient, BusinessContextService businessContextService) {
        this.aiServiceClient = aiServiceClient;
        this.businessContextService = businessContextService;
    }

    @GetMapping("/insights")
    public ResponseEntity<List<AiInsight>> getInsights() {
        return aiServiceClient.insights(businessContextService.build())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }
}
