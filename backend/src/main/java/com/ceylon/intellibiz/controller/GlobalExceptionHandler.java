package com.ceylon.intellibiz.controller;

import com.ceylon.intellibiz.dto.ApiError;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** A unique index (username, email, order number, invoice number, SKU) rejected the write. */
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<ApiError> duplicateKey(DuplicateKeyException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError("That value is already in use."));
    }
}
