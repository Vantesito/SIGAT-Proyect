package com.example.sigat.backend.controller;

import com.example.sigat.backend.service.DataImportService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/data")
public class DataImportController {
    private final DataImportService dataImportService;
    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        Workbook workbook = WorkbookFactory.create(file.getInputStream());
        dataImportService.importWorkbookData(workbook);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}