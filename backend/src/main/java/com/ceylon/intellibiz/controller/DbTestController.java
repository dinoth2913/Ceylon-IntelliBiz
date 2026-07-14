package com.ceylon.intellibiz.controller;

import java.sql.Connection;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DbTestController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/db-test")
    public String dbTest() {
        try (Connection connection = dataSource.getConnection()) {
            return "PostgreSQL connection successful: " + connection.getMetaData().getURL();
        } catch (Exception ex) {
            return "PostgreSQL connection failed: " + ex.getMessage();
        }
    }
}
