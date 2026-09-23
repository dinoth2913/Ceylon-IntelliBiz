package com.ceylon.intellibiz.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ceylon.intellibiz.model.User;
import com.ceylon.intellibiz.support.FakeUsers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class AdminRecoveryTest {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private FakeUsers fake;

    @BeforeEach
    void setUp() {
        fake = new FakeUsers();
    }

    private AdminRecovery recovery(String username, String password) {
        return new AdminRecovery(fake.repository(), encoder, username, password);
    }

    @Test
    void resetsAnExistingAdminsPasswordToTheConfiguredValue() {
        User admin = fake.add("owner", "ADMIN");
        String oldHash = admin.getPasswordHash();

        assertTrue(recovery("owner", "new-correct-horse").recover());

        assertNotEquals(oldHash, admin.getPasswordHash());
        assertTrue(encoder.matches("new-correct-horse", admin.getPasswordHash()));
    }

    @Test
    void doesNothingWhenBothAreUnset() {
        fake.add("owner", "ADMIN");
        assertFalse(recovery("", "").recover());
        assertFalse(recovery(null, null).recover());
    }

    @Test
    void refusesAHalfConfiguredRecovery() {
        User admin = fake.add("owner", "ADMIN");
        String oldHash = admin.getPasswordHash();

        assertFalse(recovery("owner", "").recover());
        assertFalse(recovery("", "new-correct-horse").recover());

        assertEquals(oldHash, admin.getPasswordHash());
    }

    @Test
    void refusesAShortPassword() {
        User admin = fake.add("owner", "ADMIN");
        String oldHash = admin.getPasswordHash();

        assertFalse(recovery("owner", "short").recover());

        assertEquals(oldHash, admin.getPasswordHash());
    }

    @Test
    void doesNothingForAnUnknownUsername() {
        assertFalse(recovery("nobody", "new-correct-horse").recover());
        assertTrue(fake.users.isEmpty());
    }

    @Test
    void neverTouchesANonAdminAccountEvenIfNamedInTheEnvVar() {
        User staff = fake.add("asha", "STAFF");
        String oldHash = staff.getPasswordHash();

        assertFalse(recovery("asha", "new-correct-horse").recover());

        assertEquals(oldHash, staff.getPasswordHash());
        assertEquals("STAFF", staff.getRole());
    }
}
