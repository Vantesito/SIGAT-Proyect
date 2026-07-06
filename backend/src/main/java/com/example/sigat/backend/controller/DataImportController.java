package com.example.sigat.backend.controller;

import com.example.sigat.backend.dto.ImportResult;
import com.example.sigat.backend.exception.UnsupportedFileException;
import com.example.sigat.backend.service.DataImportService;
import com.example.sigat.backend.service.DataValidationService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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

    @ExceptionHandler
    public ResponseEntity<Map<String,String>> handleIllegalArgument(IllegalArgumentException e){
        return new ResponseEntity<>(Map.of("message",e.getMessage()),HttpStatus.UNPROCESSABLE_ENTITY);
    }
    @ExceptionHandler
    public ResponseEntity<Map<String,String>> handleIllegalArgument(UnsupportedFileException e){
        return new ResponseEntity<>(Map.of("message",e.getMessage()),HttpStatus.UNPROCESSABLE_ENTITY);
    }
    @ExceptionHandler(exception = HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String,String>> handleHttpMessageNotReadable(){
        return new ResponseEntity<>(Map.of("message", "El objeto JSON no tiene el formato correcto"), HttpStatus.BAD_REQUEST);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@AuthenticationPrincipal UserDetails ap,
                                    @RequestParam("file") MultipartFile file) {
        try {
            // Validamos la extensión por el NOMBRE, sin exigir un File físico.
            dataValidationService.validateExtension(file.getOriginalFilename());

            // try-with-resources: el Workbook se cierra solo al terminar,
            // aunque el import lance, evitando fugas de memoria con archivos grandes.
            try (Workbook workbook = dataValidationService.parseWorkbook(file.getInputStream())) {
                // Los puntos creados por la carga masiva quedan atribuidos al
                // usuario autenticado que la ejecuta (igual que la creación
                // individual de puntos), no a un placeholder vacío.
                ImportResult result = dataImportService.importWorkbookData(workbook, ap.getUsername());
                return new ResponseEntity<>(result, HttpStatus.OK);
            }
        } catch (UnsupportedFileException | IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (IOException e) {
            return new ResponseEntity<>(Map.of("message", "No se pudo leer el archivo"), HttpStatus.BAD_REQUEST);
        }
    }
}
