package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.ImportResult;
import com.example.sigat.backend.repository.DiseaseRepository;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataImportServiceTest {

    @Mock
    private MapService mapService;
    @Mock
    private DiseaseRepository diseaseRepository;
    @Mock
    private WaitingService waitingService;
    @Mock
    private DataValidationService dataValidationService;

    private DataImportService dataImportService;

    private static Workbook workbook;

    // Usuario "autor" de la carga en el test (ya no se pasa "" hardcodeado).
    private static final String USERNAME_TEST = "admin@sigat.cl";

    @BeforeAll
    static void loadWorkbook() throws IOException {
        // El archivo debe estar en src/test/resources para cargarse desde el classpath
        InputStream is = DataImportServiceTest.class.getClassLoader()
                .getResourceAsStream("happy-path.xlsx");
        assertNotNull(is, "No se encontró happy-path.xlsx en src/test/resources");
        workbook = WorkbookFactory.create(is);
    }

    @AfterAll
    static void closeWorkbook() throws IOException {
        if (workbook != null) {
            workbook.close();
        }
    }

    @BeforeEach
    void setup() {
        dataImportService = new DataImportService(
                diseaseRepository, mapService, waitingService, dataValidationService);
    }

    @Test
    void importWorkbookData_happyPath_sinErrores() {
        // La enfermedad de cada fila "existe": devolvemos un id cualquiera
        when(diseaseRepository.findByNameEqualsIgnoreCase(anyString())).thenReturn(1L);

        ImportResult result = dataImportService.importWorkbookData(workbook, USERNAME_TEST);

        // importWorkbookData ya no lanza (captura por fila), así que verificamos el resultado
        assertEquals(0, result.fallidos(), () -> "Errores encontrados: " + result.errores());
        assertTrue(result.importados() > 0, "Debería importar al menos una fila");
    }
}