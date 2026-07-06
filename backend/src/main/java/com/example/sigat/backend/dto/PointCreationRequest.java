package com.example.sigat.backend.dto;
import java.time.LocalDate;

public record PointCreationRequest(
        String rut,
        Long disease_id,
        String city,
        String address,
        boolean in_treatment,
        LocalDate treatment_start,
        LocalDate next_control
){}
