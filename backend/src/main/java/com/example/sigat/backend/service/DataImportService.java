package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.ImportResult;
import com.example.sigat.backend.dto.PointCreationRequest;
import com.example.sigat.backend.repository.DiseaseRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DataImportService {
    private final DiseaseRepository diseaseRepository;
    private final MapService mapService;
    private final WaitingService waitingService;
    private final DataValidationService dataValidationService;

    // Columnas que el archivo debe tener (los nombres del encabezado).
    private static final List<String> COLUMNAS_REQUERIDAS = List.of(
            "rut", "enfermedad", "ciudad", "domicilio", "enTratamiento", "fechaInicio", "fechaProximoControl"
    );

    public DataImportService(DiseaseRepository diseaseRepository, MapService mapService,
                             WaitingService waitingService, DataValidationService dataValidationService) {
        this.diseaseRepository = diseaseRepository;
        this.mapService = mapService;
        this.waitingService = waitingService;
        this.dataValidationService = dataValidationService;
    }

    public ImportResult importWorkbookData(Workbook workbook) {
        Sheet data = workbook.getSheetAt(0);
        Map<String, Integer> headers = generateHeaderMap(data);
        validarColumnas(headers); // si faltan columnas, aborta todo el archivo (no es error de una fila)

        List<String> errores = new ArrayList<>();
        int importados = 0;

        int lastRow = data.getLastRowNum();
        for (int r = 1; r <= lastRow; r++) { // fila 0 = encabezado
            Row row = data.getRow(r);
            if (row == null || filaVacia(row, headers)) {
                continue; // saltar filas totalmente vacías (comunes al final del Excel)
            }
            int numeroFilaExcel = r + 1; // lo que el usuario ve en su Excel (base 1, con encabezado)
            try {
                procesarFila(row, headers);
                importados++;
            } catch (Exception e) {
                errores.add("Fila " + numeroFilaExcel + " no válida por: " + e.getMessage());
            }
        }

        return new ImportResult(importados, errores.size(), errores);
    }

    // Valida y guarda UNA fila. Cualquier problema se lanza como excepción
    // con un mensaje claro, que el llamador convierte en "Fila X no válida por: ...".
    private void procesarFila(Row row, Map<String, Integer> headers) {
        // 1. RUT (dígito verificador) — barato, primero
        String rut = readCell(row, headers.get("rut"));
        dataValidationService.validateRut(rut);

        // 2. Enfermedad debe existir en la base
        String enfermedad = readCell(row, headers.get("enfermedad"));
        Long diseaseId = diseaseRepository.findByNameEqualsIgnoreCase(enfermedad);
        if (diseaseId == null) {
            throw new IllegalArgumentException("la enfermedad '" + enfermedad + "' no existe en el sistema");
        }

        // 3. Ciudad y domicilio presentes
        String city = readCell(row, headers.get("ciudad"));
        if (city.isBlank()) {
            throw new IllegalArgumentException("la ciudad está vacía");
        }
        String address = readCell(row, headers.get("domicilio"));
        if (address.isBlank()) {
            throw new IllegalArgumentException("el domicilio está vacío");
        }

        // 4. Estado de tratamiento (Sí/No/true/false)
        boolean inTreatment = dataValidationService.parseState(readCell(row, headers.get("enTratamiento")));

        // 5. Fechas: obligatorias y bien formadas SOLO si está en tratamiento
        String fiStr = readCell(row, headers.get("fechaInicio"));
        String fcStr = readCell(row, headers.get("fechaProximoControl"));
        LocalDate treatmentStart = null;
        LocalDate nextControl = null;
        if (inTreatment) {
            if (fiStr.isBlank() || fcStr.isBlank()) {
                throw new IllegalArgumentException("está en tratamiento pero falta fechaInicio o fechaProximoControl");
            }
            treatmentStart = parseDate(fiStr);
            nextControl = parseDate(fcStr);
        }

        // 6. Dirección (lo más caro): createPoint geocodifica con Nominatim y arma el cuadrante.
        //    Si la dirección no se encuentra, GeocodingService lanza y esta fila queda marcada.
        PointCreationRequest pcr = new PointCreationRequest(rut, diseaseId, city, address, inTreatment, treatmentStart, nextControl);
        mapService.createPoint(pcr, "");
        waitingService.acquire(); // respeta el límite de Nominatim entre filas geocodificadas
    }

    private Map<String, Integer> generateHeaderMap(Sheet data) {
        Row firstRow = data.getRow(0);
        if (firstRow == null) {
            throw new IllegalArgumentException("El archivo no tiene fila de encabezados");
        }
        Map<String, Integer> headers = new HashMap<>();
        for (Cell cell : firstRow) {
            headers.put(cell.toString().strip(), cell.getColumnIndex());
        }
        return headers;
    }

    private void validarColumnas(Map<String, Integer> headers) {
        List<String> faltan = new ArrayList<>();
        for (String col : COLUMNAS_REQUERIDAS) {
            if (!headers.containsKey(col)) {
                faltan.add(col);
            }
        }
        if (!faltan.isEmpty()) {
            throw new IllegalArgumentException(
                    "El archivo no tiene las columnas correctas. Faltan: " + String.join(", ", faltan));
        }
    }

    // Lee una celda de forma segura por su índice de columna, devolviendo texto
    // aunque la celda sea numérica, fecha o esté vacía. Evita el desajuste que
    // produce iterar celdas cuando hay huecos en la fila.
    private String readCell(Row row, Integer col) {
        if (col == null) {
            return "";
        }
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) {
            return "";
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().strip();
            case BOOLEAN -> Boolean.toString(cell.getBooleanCellValue());
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    // Fecha nativa de Excel -> texto AAAA-MM-DD
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double d = cell.getNumericCellValue();
                // Sin decimales: lo dejamos como entero (útil si el RUT viene numérico)
                yield (d == Math.floor(d)) ? String.valueOf((long) d) : String.valueOf(d);
            }
            default -> "";
        };
    }

    private boolean filaVacia(Row row, Map<String, Integer> headers) {
        for (Integer col : headers.values()) {
            Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (c != null && !c.toString().isBlank()) {
                return false;
            }
        }
        return true;
    }

    private LocalDate parseDate(String date) {
        try {
            return LocalDate.parse(date.strip());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("la fecha '" + date + "' no tiene el formato AAAA-MM-DD");
        }
    }
}