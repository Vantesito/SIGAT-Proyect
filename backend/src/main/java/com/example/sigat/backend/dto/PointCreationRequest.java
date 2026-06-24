package com.example.sigat.backend.dto;

public record PointCreationRequest(
        double x_coordinate,
        double y_coordinate,
        String rut,
        Long disease_id
){}
