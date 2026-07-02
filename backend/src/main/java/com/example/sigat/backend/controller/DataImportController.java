package com.example.sigat.backend.controller;

import com.example.sigat.backend.exception.UnsupportedFileException;
import com.example.sigat.backend.service.DataImportService;
import com.example.sigat.backend.service.DataValidationService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/data")
public class DataImportController {
    private final DataImportService dataImportService;
    private final DataValidationService dataValidationService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        try {
            dataValidationService.validateExtension(file.getResource().getFile());
            Workbook workbook = dataValidationService.parseWorkbook(file.getInputStream());
            dataImportService.importWorkbookData(workbook);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (UnsupportedFileException | IllegalArgumentException e) {
            return new ResponseEntity<>( Map.of("message", e.getMessage()),HttpStatus.BAD_REQUEST);
        }
    }
}