package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Proxy;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoOperations;

class DbTestControllerTest {

    private static MongoOperations mongo(boolean healthy) {
        return (MongoOperations) Proxy.newProxyInstance(
            DbTestControllerTest.class.getClassLoader(),
            new Class<?>[] {MongoOperations.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "executeCommand" -> {
                    if (!healthy) {
                        throw new IllegalStateException("mongodb://admin:hunter2@secret-host:27017 refused the connection");
                    }
                    yield new org.bson.Document("ok", 1.0);
                }
                case "execute" -> "intellibiz";
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    @Test
    void reportsSuccessAndTheDatabaseNameWhenMongoAnswers() {
        String response = new DbTestController(mongo(true)).dbTest();

        assertEquals("MongoDB connection successful: database 'intellibiz'", response);
    }

    @Test
    void reportsFailureWithoutLeakingHostsOrCredentials() {
        String response = new DbTestController(mongo(false)).dbTest();

        assertTrue(response.startsWith("MongoDB connection failed"));
        assertFalse(response.contains("hunter2"));
        assertFalse(response.contains("secret-host"));
    }
}
