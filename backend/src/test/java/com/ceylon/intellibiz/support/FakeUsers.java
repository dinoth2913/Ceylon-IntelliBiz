package com.ceylon.intellibiz.support;

import com.ceylon.intellibiz.model.User;
import com.ceylon.intellibiz.repository.UserRepository;
import com.ceylon.intellibiz.security.JwtService;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/** In-memory stand-in for the users table, so security tests need no database. */
public final class FakeUsers {

    public final List<User> users = new ArrayList<>();

    public UserRepository repository() {
        return (UserRepository) Proxy.newProxyInstance(
            FakeUsers.class.getClassLoader(),
            new Class<?>[] {UserRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    User user = (User) args[0];
                    if (user.getId() == null) {
                        user.setId(users.stream().mapToLong(User::getId).max().orElse(0) + 1);
                    }
                    users.removeIf(existing -> Objects.equals(existing.getId(), user.getId()));
                    users.add(user);
                    yield user;
                }
                case "findAll" -> new ArrayList<>(users);
                case "findById" -> users.stream().filter(u -> Objects.equals(u.getId(), args[0])).findFirst();
                case "findByUsername" -> users.stream().filter(u -> u.getUsername().equals(args[0])).findFirst();
                case "findByEmail" -> users.stream().filter(u -> u.getEmail().equals(args[0])).findFirst();
                case "existsByUsername" -> users.stream().anyMatch(u -> u.getUsername().equals(args[0]));
                case "existsByEmail" -> users.stream().anyMatch(u -> u.getEmail().equals(args[0]));
                case "countByRole" -> users.stream().filter(u -> u.getRole().equals(args[0])).count();
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeUserRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    public User add(String username, String role) {
        User user = new User();
        user.setId(users.stream().mapToLong(User::getId).max().orElse(0) + 1);
        user.setUsername(username);
        user.setEmail(username + "@company.lk");
        user.setPasswordHash("not-a-real-hash");
        user.setRole(role);
        users.add(user);
        return user;
    }

    public User named(String username) {
        return users.stream().filter(u -> u.getUsername().equals(username)).findFirst().orElseThrow();
    }

    /** A valid "Authorization" header for a (created on demand) user holding the given role. */
    public String bearer(JwtService jwtService, String role) {
        String username = "test-" + role.toLowerCase();
        User user = users.stream().filter(u -> u.getUsername().equals(username)).findFirst().orElseGet(() -> add(username, role));
        return bearerFor(jwtService, user);
    }

    public String bearerFor(JwtService jwtService, User user) {
        return "Bearer " + jwtService.generateToken(user.getId(), user.getUsername(), user.getRole());
    }

    public Optional<User> find(String username) {
        return users.stream().filter(u -> u.getUsername().equals(username)).findFirst();
    }
}
