package com.ceylon.intellibiz.service;

import com.ceylon.intellibiz.model.User;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.security.Roles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Creates the first admin at startup from configuration, because public sign-up can only ever
 * produce STAFF accounts. It only acts when a password is configured AND no admin exists yet, and it
 * never promotes an existing account: otherwise anyone could pre-register the admin's username.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String email;
    private final String password;

    public AdminBootstrap(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.bootstrap-admin.username:}") String username,
        @Value("${app.bootstrap-admin.email:}") String email,
        @Value("${app.bootstrap-admin.password:}") String password
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username == null ? "" : username.trim();
        this.email = email == null ? "" : email.trim();
        this.password = password == null ? "" : password;
    }

    @Override
    public void run(ApplicationArguments args) {
        bootstrap();
    }

    /** Returns true only when a new admin account was created. */
    boolean bootstrap() {
        if (password.isEmpty()) {
            if (userRepository.countByRole(Roles.ADMIN) == 0) {
                log.warn("No admin account exists. Set BOOTSTRAP_ADMIN_PASSWORD (and optionally BOOTSTRAP_ADMIN_USERNAME / "
                    + "BOOTSTRAP_ADMIN_EMAIL) and restart to create one.");
            }
            return false;
        }
        if (userRepository.countByRole(Roles.ADMIN) > 0) {
            log.info("An admin account already exists; ignoring the bootstrap admin settings.");
            return false;
        }
        if (username.length() < 3 || !email.contains("@") || password.length() < MIN_PASSWORD_LENGTH) {
            log.warn("Bootstrap admin not created: it needs a username of 3+ characters, an email address and a password of {}+ characters.",
                MIN_PASSWORD_LENGTH);
            return false;
        }
        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
            log.warn("Bootstrap admin not created: that username or email already belongs to an existing account. "
                + "Existing accounts are never promoted automatically; pick a different username/email.");
            return false;
        }

        User admin = new User();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(Roles.ADMIN);
        admin.setCreatedAt(Instant.now());
        userRepository.save(admin);
        log.info("Created the first admin account '{}'.", username);
        return true;
    }
}
