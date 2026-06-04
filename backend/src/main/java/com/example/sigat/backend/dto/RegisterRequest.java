package com.example.sigat.backend.dto;

public record RegisterRequest(
        String email,
        String confirmation_email,
        String names,
        String surnames,
        String password,
        String phoneNumber,
        String rut,
        String country,
        String region,
        String city,
        String institution
) {}
