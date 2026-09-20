package com.ceylon.intellibiz.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Set;

/**
 * The roles a user can hold. ADMIN manages users and can do everything; SALES and FINANCE each
 * write their own area but can read all business data; STAFF is the default for new sign-ups
 * and has no access to business data until an admin assigns a real role.
 */
public final class Roles {

    public static final String ADMIN = "ADMIN";
    public static final String SALES = "SALES";
    public static final String FINANCE = "FINANCE";
    public static final String STAFF = "STAFF";

    /** In the order they are offered in the UI. */
    public static final List<String> ASSIGNABLE = List.of(ADMIN, SALES, FINANCE, STAFF);

    /** Roles that may see business data (customers, orders, invoices, inventory, vendors, insights). */
    public static final String[] BUSINESS = {ADMIN, SALES, FINANCE};

    private static final Set<String> BUSINESS_AUTHORITIES = Set.of("ROLE_" + ADMIN, "ROLE_" + SALES, "ROLE_" + FINANCE);

    private Roles() {
    }

    public static String normalise(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    public static boolean hasBusinessAccess(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (BUSINESS_AUTHORITIES.contains(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
