package com.example.sigat.backend.dto;

public record AuthenticationRequest(
        String email,
        String password
){}
