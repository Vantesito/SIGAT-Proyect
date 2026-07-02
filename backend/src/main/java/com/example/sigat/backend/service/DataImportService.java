package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.PointCreationRequest;
import com.example.sigat.backend.repository.DiseaseRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Iterator;

@Service
public class DataImportService {
    private final DiseaseRepository diseaseRepository;
    private final MapService mapService;
    private final WaitingService waitingService;
    private final DataValidationService dataValidationService;

    public DataImportService(DiseaseRepository diseaseRepository, MapService mapService, WaitingService waitingService, DataValidationService dataValidationService) {
        this.diseaseRepository = diseaseRepository;
        this.mapService = mapService;
        this.waitingService= waitingService;
        this.dataValidationService = dataValidationService;
    }

    public void importWorkbookData(Workbook workbook){
        Sheet data=workbook.getSheetAt(0);
        HashMap<String, Integer> headers = generateHeaderMap(data);
        Iterator<Row> rows = data.rowIterator();
        rows.next();
        while (rows.hasNext()){
            Iterator<Cell> cells= rows.next().cellIterator();
            String[] dataStrings= new String[7];
            for (int i = 0; i < 7; i++) {
                dataStrings[i]=cells.next().toString();
            }
            String rut;
            String address;
            String city;
            boolean inTreatment;
            LocalDate treatmentStart;
            LocalDate nextControl;
            Long diseaseId;
            PointCreationRequest pcr;
            try {
                rut = dataStrings[headers.get("rut")];
                address = dataStrings[headers.get("domicilio")];
                city = dataStrings[headers.get("ciudad")];
                inTreatment = dataValidationService.parseState(dataStrings[headers.get("enTratamiento")]);
                treatmentStart = parseDate(dataStrings[headers.get("fechaInicio")]);
                nextControl = parseDate(dataStrings[headers.get("fechaProximoControl")]);
                diseaseId = diseaseRepository.findByNameEqualsIgnoreCase(dataStrings[headers.get("enfermedad")]);
                pcr = new PointCreationRequest(rut, diseaseId, city, address, inTreatment, treatmentStart, nextControl);
                mapService.createPoint(pcr, "");
                waitingService.acquire();
            } catch (NullPointerException e) {
                throw new IllegalArgumentException("El documento no tiene sus datos en el formato correcto, revise el títulos de las columnas");
            }
        }
    }
    private HashMap<String,Integer> generateHeaderMap(Sheet data){
        Row firstRow = data.getRow(0);
        Iterator<Cell> cells = firstRow.cellIterator();
        HashMap<String, Integer> headers = new HashMap<>();
        for (int i = 0; i <7 && cells.hasNext() ; i++) {
            String title = cells.next().toString();
            headers.put(title, i);
        }
        return headers;
    }
    private LocalDate parseDate(String date){
        if (!date.isBlank()) {
            return LocalDate.parse(date);
        } else {
            return null;
        }
    }
}
