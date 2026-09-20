package com.ceylon.intellibiz.controller;

import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin-only connectivity check (see SecurityConfig). It never echoes hosts, credentials or driver messages. */
@RestController
@RequestMapping("/api")
public class DbTestController {

    private final MongoOperations mongoOperations;

    public DbTestController(MongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
    }

    @GetMapping("/db-test")
    public String dbTest() {
        try {
            mongoOperations.executeCommand("{ ping: 1 }");
            String database = mongoOperations.execute(db -> db.getName());
            return "MongoDB connection successful: database '" + database + "'";
        } catch (Exception ex) {
            return "MongoDB connection failed (" + ex.getClass().getSimpleName() + ")";
        }
    }
}
