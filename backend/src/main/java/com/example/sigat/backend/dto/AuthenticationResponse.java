package com.example.sigat.backend.dto;

public record AuthenticationResponse(
        String token,
        String correo,
        String rol
){}
