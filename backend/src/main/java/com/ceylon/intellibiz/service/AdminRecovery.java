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

import java.util.Optional;

/**
 * Recovers a locked-out admin without email: set RECOVERY_ADMIN_USERNAME and RECOVERY_ADMIN_PASSWORD,
 * restart the backend, sign in with the new password, then unset both and restart again — otherwise the
 * password keeps getting reset back to that value on every restart. It only ever touches an account that
 * already has the ADMIN role, so it can't be used to take over an arbitrary account.
 */
@Component
public class AdminRecovery implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminRecovery.class);
    static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminRecovery(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.recovery-admin.username:}") String username,
        @Value("${app.recovery-admin.password:}") String password
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username == null ? "" : username.trim();
        this.password = password == null ? "" : password;
    }

    @Override
    public void run(ApplicationArguments args) {
        recover();
    }

    /** Returns true only when an admin's password was actually reset. */
    boolean recover() {
        if (username.isEmpty() && password.isEmpty()) {
            return false;
        }
        if (username.isEmpty() || password.isEmpty()) {
            log.warn("Admin recovery not applied: set both RECOVERY_ADMIN_USERNAME and RECOVERY_ADMIN_PASSWORD (not just one).");
            return false;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            log.warn("Admin recovery not applied: RECOVERY_ADMIN_PASSWORD needs to be {}+ characters.", MIN_PASSWORD_LENGTH);
            return false;
        }

        Optional<User> found = userRepository.findByUsername(username);
        if (found.isEmpty()) {
            log.warn("Admin recovery not applied: no account named '{}' exists.", username);
            return false;
        }
        User user = found.get();
        if (!Roles.ADMIN.equals(Roles.normalise(user.getRole()))) {
            log.warn("Admin recovery not applied: '{}' is not an admin account.", username);
            return false;
        }

        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
        log.warn("Reset the password for admin account '{}' from RECOVERY_ADMIN_PASSWORD. "
            + "Sign in with the new password, then unset RECOVERY_ADMIN_USERNAME/RECOVERY_ADMIN_PASSWORD and restart — "
            + "otherwise the password resets back to this value every time the backend restarts.", username);
        return true;
    }
}
