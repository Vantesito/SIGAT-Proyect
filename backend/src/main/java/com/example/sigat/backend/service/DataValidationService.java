package com.example.sigat.backend.service;

import com.example.sigat.backend.exception.UnsupportedFileException;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

@Service
public class DataValidationService {
    public void validateExtension(File file){
        if(!(file.getName().endsWith(".xls")||file.getName().endsWith(".xlsx"))){
            throw new IllegalArgumentException("El archivo debe tener extensión .xls o .xlsx");
        }
    }
    public Workbook parseWorkbook(InputStream file) {
        try {
            return WorkbookFactory.create(file);
        } catch (IOException e) {
            throw new UnsupportedFileException("El archivo no es un archivo de Excel válido");
        }
    }
    public boolean parseState(String state){
        String s = state.toLowerCase().strip();
        if (s.equals("sí")||s.equals("true")||s.equals("si")){
            return true;
        } else if (s.equals("no")||s.equals("false")){
            return false;
        } else {
            throw new IllegalArgumentException(state+" no es un valor válido, debe ser Sí, No, true o false");
        }
    }
}
