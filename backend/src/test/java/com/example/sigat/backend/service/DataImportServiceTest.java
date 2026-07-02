package com.example.sigat.backend.service;

import com.example.sigat.backend.repository.DiseaseRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.File;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@RequiredArgsConstructor
class DataImportServiceTest {
    @MockitoBean
    private final MapService mapService=mock();
    @MockitoBean
    private final DiseaseRepository diseaseRepository=mock();
    @MockitoBean
    private final WaitingService waitingService=mock();
    private static Workbook workbook;
    private final DataImportService dataImportService= new DataImportService(diseaseRepository, mapService,waitingService);
    @BeforeAll
    public static void setup() throws IOException {
        workbook = WorkbookFactory.create(new File("happy-path.xlsx"));
    }
    @Test
    public void assertImportWorkbookData_DoesNotThrow(){
        assertDoesNotThrow(()->dataImportService.importWorkbookData(workbook));
    }
}