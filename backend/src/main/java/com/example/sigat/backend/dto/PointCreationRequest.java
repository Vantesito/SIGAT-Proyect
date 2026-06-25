package com.example.sigat.backend.dto;
import java.time.LocalDate;

public record PointCreationRequest(
        double x_coordinate,
        double y_coordinate,
        String rut,
        Long disease_id,
        String city,
        boolean in_treatment,
        LocalDate treatment_start,
        LocalDate next_control
){}
