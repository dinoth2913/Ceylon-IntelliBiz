package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.PasswordResetResult;
import com.ceylon.intellibiz.dto.RoleUpdateRequest;
import com.ceylon.intellibiz.dto.UserSummary;
import com.ceylon.intellibiz.model.User;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.security.Roles;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/** Team management. Restricted to admins by the rules in SecurityConfig. */
@RestController
@RequestMapping("/api/users")
public class UserAdminController {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserSummary> listUsers() {
        return userRepository.findAll().stream()
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).thenComparing(User::getId))
            .map(UserSummary::from)
            .toList();
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable String id, @Valid @RequestBody RoleUpdateRequest request) {
        String newRole = Roles.normalise(request.role());
        if (!Roles.ASSIGNABLE.contains(newRole)) {
            return ResponseEntity.badRequest().body(new ApiError("Role must be one of: " + String.join(", ", Roles.ASSIGNABLE)));
        }

        Optional<User> found = userRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("User not found"));
        }
        User user = found.get();

        boolean demotingAnAdmin = Roles.ADMIN.equals(Roles.normalise(user.getRole())) && !Roles.ADMIN.equals(newRole);
        if (demotingAnAdmin && userRepository.countByRole(Roles.ADMIN) <= 1) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("At least one admin is required. Make someone else an admin first."));
        }

        user.setRole(newRole);
        return ResponseEntity.ok(UserSummary.from(userRepository.save(user)));
    }

    /**
     * Sets the account to a freshly generated password and returns it once, in plain text — it is never
     * stored or logged anywhere. The admin doing the reset is responsible for getting it to the person
     * (message them directly, don't email or paste it somewhere public); they should change it once signed in.
     */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable String id) {
        Optional<User> found = userRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("User not found"));
        }
        User user = found.get();
        String temporaryPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        userRepository.save(user);
        return ResponseEntity.ok(new PasswordResetResult(user.getId(), user.getUsername(), temporaryPassword));
    }

    private static String generateTemporaryPassword() {
        byte[] bytes = new byte[15];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
