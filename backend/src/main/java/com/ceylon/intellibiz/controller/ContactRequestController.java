package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ContactRequestForm;
import com.ceylon.intellibiz.model.ContactRequest;
import com.ceylon.intellibiz.repository.ContactRequestRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/contact-requests")
public class ContactRequestController {

    private final ContactRequestRepository contactRequestRepository;

    public ContactRequestController(ContactRequestRepository contactRequestRepository) {
        this.contactRequestRepository = contactRequestRepository;
    }

    /** Public: anyone can send a demo request. Listing them is restricted to signed-in users. */
    @PostMapping
    public ResponseEntity<Void> submit(@Valid @RequestBody ContactRequestForm form) {
        boolean looksLikeSpam = form.website() != null && !form.website().isBlank();
        if (!looksLikeSpam) {
            ContactRequest request = new ContactRequest();
            request.setName(form.name().trim());
            request.setEmail(form.email().trim());
            request.setCompany(form.company().trim());
            request.setMessage(form.message() == null || form.message().isBlank() ? null : form.message().trim());
            request.setCreatedAt(Instant.now());
            contactRequestRepository.save(request);
        }
        // Spam gets the same response, so bots can't tell they were filtered.
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping
    public List<ContactRequest> list() {
        return contactRequestRepository.findAllByOrderByCreatedAtDesc();
    }
}
