package com.example.calculator.controllers;


import com.example.calculator.services.Result;
import com.example.calculator.services.MainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200") // Allow requests from the frontend
public class controller {
    @Autowired
    private MainService service;

    @GetMapping("/evaluate")
    public ResponseEntity<Result> getResult(@RequestParam String expression) {
        Double result = service.evaluate(expression);
        return ResponseEntity.ok(new Result(expression, result));
    }

    @ExceptionHandler(ArithmeticException.class)
    public ResponseEntity<Map<String, String>> handleArithmeticException(ArithmeticException e) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", e.getMessage() != null ? e.getMessage() : "Arithmetic error occurred");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", e.getMessage() != null ? e.getMessage() : "Invalid expression");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Result>> getHistory() {
        return ResponseEntity.ok(service.getHistory());
    }

    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory() {
        service.clearHistory();
        return ResponseEntity.noContent().build();
    }

}
