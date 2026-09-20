package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.dto.AuthResponse;
import com.ceylon.intellibiz.dto.LoginRequest;
import com.ceylon.intellibiz.dto.RegisterRequest;
import com.ceylon.intellibiz.model.User;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.security.JwtService;
import com.ceylon.intellibiz.security.Roles;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    static final String DEFAULT_ROLE = Roles.STAFF;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("Username is already taken"));
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("An account with this email already exists"));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        // Public sign-up must never choose its own privileges: any "role" in the request body is ignored.
        user.setRole(DEFAULT_ROLE);
        user.setCreatedAt(Instant.now());
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getId(), saved.getUsername(), saved.getRole());
        return ResponseEntity.ok(new AuthResponse(token, saved.getId(), saved.getUsername(), saved.getEmail(), saved.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> maybeUser = userRepository.findByUsername(request.getUsernameOrEmail())
            .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()));

        if (maybeUser.isEmpty() || !passwordEncoder.matches(request.getPassword(), maybeUser.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("Invalid username/email or password"));
        }

        User user = maybeUser.get();
        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole());
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail(), user.getRole()));
    }

    /** The signed-in user as stored now, so the UI picks up a role change without a fresh login. */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
            .<ResponseEntity<?>>map(user -> ResponseEntity.ok(new AuthResponse(null, user.getId(), user.getUsername(), user.getEmail(), user.getRole())))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("User not found")));
    }
}
