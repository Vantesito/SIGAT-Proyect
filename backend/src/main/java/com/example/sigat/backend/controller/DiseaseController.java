package com.example.sigat.backend.controller;

import com.example.sigat.backend.model.Disease;
import com.example.sigat.backend.repository.DiseaseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diseases")

public class DiseaseController {
    private final DiseaseRepository diseaseRepository;

    @ExceptionHandler
    public ResponseEntity<Map<String,String>> handleIllegalArgument(IllegalArgumentException e){
        return new ResponseEntity<>(Map.of("message",e.getMessage()), HttpStatus.UNPROCESSABLE_ENTITY);
    }
    public DiseaseController(DiseaseRepository diseaseRepository) {
        this.diseaseRepository = diseaseRepository;
    }

    @GetMapping
    public ResponseEntity<List<Disease>> getAll() {
        return ResponseEntity.ok(diseaseRepository.findAll());
    }
}