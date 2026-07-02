package com.example.sigat.backend.controller;

import com.example.sigat.backend.dto.ImportResult;
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
@CrossOrigin(origins = "*")
public class DataImportController {
    private final DataImportService dataImportService;
    private final DataValidationService dataValidationService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            // Validamos la extensión por el NOMBRE, sin exigir un File físico.
            dataValidationService.validateExtension(file.getOriginalFilename());

            // try-with-resources: el Workbook se cierra solo al terminar,
            // aunque el import lance, evitando fugas de memoria con archivos grandes.
            try (Workbook workbook = dataValidationService.parseWorkbook(file.getInputStream())) {
                ImportResult result = dataImportService.importWorkbookData(workbook);
                return new ResponseEntity<>(result, HttpStatus.OK);
            }
        } catch (UnsupportedFileException | IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (IOException e) {
            return new ResponseEntity<>(Map.of("message", "No se pudo leer el archivo"), HttpStatus.BAD_REQUEST);
        }
    }
}