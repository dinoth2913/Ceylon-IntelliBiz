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

class AdminBootstrapTest {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private FakeUsers fake;

    @BeforeEach
    void setUp() {
        fake = new FakeUsers();
    }

    private AdminBootstrap bootstrap(String username, String email, String password) {
        return new AdminBootstrap(fake.repository(), encoder, username, email, password);
    }

    @Test
    void createsTheFirstAdminWithAHashedPassword() {
        assertTrue(bootstrap("owner", "owner@company.lk", "correct-horse").bootstrap());

        assertEquals(1, fake.users.size());
        User admin = fake.users.get(0);
        assertEquals("owner", admin.getUsername());
        assertEquals("owner@company.lk", admin.getEmail());
        assertEquals("ADMIN", admin.getRole());
        assertNotEquals("correct-horse", admin.getPasswordHash());
        assertTrue(encoder.matches("correct-horse", admin.getPasswordHash()));
    }

    @Test
    void doesNothingWithoutAPassword() {
        assertFalse(bootstrap("owner", "owner@company.lk", "").bootstrap());
        assertFalse(bootstrap("owner", "owner@company.lk", null).bootstrap());
        assertTrue(fake.users.isEmpty());
    }

    @Test
    void doesNothingOnceAnAdminExists() {
        fake.add("existing-admin", "ADMIN");

        assertFalse(bootstrap("owner", "owner@company.lk", "correct-horse").bootstrap());

        assertEquals(1, fake.users.size());
    }

    @Test
    void runningTwiceOnlyEverCreatesOneAdmin() {
        AdminBootstrap bootstrap = bootstrap("owner", "owner@company.lk", "correct-horse");
        assertTrue(bootstrap.bootstrap());
        assertFalse(bootstrap.bootstrap());
        assertEquals(1, fake.users.size());
    }

    @Test
    void neverPromotesAnExistingAccountThatHasTheConfiguredUsername() {
        // Someone registered the admin's username before the bootstrap ran. They must not inherit admin rights.
        User squatter = fake.add("owner", "STAFF");

        assertFalse(bootstrap("owner", "owner@company.lk", "correct-horse").bootstrap());

        assertEquals("STAFF", squatter.getRole());
        assertEquals(1, fake.users.size());
    }

    @Test
    void neverPromotesAnExistingAccountThatHasTheConfiguredEmail() {
        User squatter = fake.add("someone", "STAFF");
        squatter.setEmail("owner@company.lk");

        assertFalse(bootstrap("owner", "owner@company.lk", "correct-horse").bootstrap());

        assertEquals("STAFF", squatter.getRole());
        assertEquals(1, fake.users.size());
    }

    @Test
    void refusesWeakOrIncompleteSettings() {
        assertFalse(bootstrap("owner", "owner@company.lk", "short").bootstrap());
        assertFalse(bootstrap("ow", "owner@company.lk", "correct-horse").bootstrap());
        assertFalse(bootstrap("owner", "not-an-email", "correct-horse").bootstrap());
        assertFalse(bootstrap("", "owner@company.lk", "correct-horse").bootstrap());
        assertTrue(fake.users.isEmpty());
    }
}
