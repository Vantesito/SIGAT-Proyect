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

    public DataImportService(DiseaseRepository diseaseRepository, MapService mapService, WaitingService waitingService) {
        this.diseaseRepository = diseaseRepository;
        this.mapService = mapService;
        this.waitingService= waitingService;
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
            String rut = dataStrings[headers.get("rut")];
            String address = dataStrings[headers.get("domicilio")];
            String city = dataStrings[headers.get("ciudad")];
            boolean inTreatment= dataStrings[headers.get("enTratamiento")].equals("Sí");
            LocalDate treatmentStart = parseDate(dataStrings[headers.get("fechaInicio")]);
            LocalDate nextControl= parseDate(dataStrings[headers.get("fechaProximoControl")]);
            Long diseaseId = diseaseRepository.findByNameEqualsIgnoreCase(dataStrings[headers.get("enfermedad")]);
            PointCreationRequest pcr = new PointCreationRequest(rut,diseaseId,city,address,inTreatment,treatmentStart,nextControl);
            mapService.createPoint(pcr,"");
            waitingService.acquire();
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
