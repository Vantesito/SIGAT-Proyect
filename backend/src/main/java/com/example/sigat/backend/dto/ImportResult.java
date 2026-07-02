package com.example.sigat.backend.dto;

import java.util.List;


public record ImportResult(int importados, int fallidos, List<String> errores) {
}