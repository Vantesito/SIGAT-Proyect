package com.psylink.backend.dto;

public record AuthenticationRequest(String email,
    String password){}
