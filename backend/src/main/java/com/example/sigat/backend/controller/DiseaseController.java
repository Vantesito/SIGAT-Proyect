package com.example.sigat.backend.controller;

import com.example.sigat.backend.model.Disease;
import com.example.sigat.backend.repository.DiseaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/diseases")
@CrossOrigin(origins = "*")
public class DiseaseController {
    private final DiseaseRepository diseaseRepository;

    public DiseaseController(DiseaseRepository diseaseRepository) {
        this.diseaseRepository = diseaseRepository;
    }

    @GetMapping
    public ResponseEntity<List<Disease>> getAll() {
        return ResponseEntity.ok(diseaseRepository.findAll());
    }
}