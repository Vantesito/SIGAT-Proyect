package com.example.sigat.backend.service;

import com.example.sigat.backend.exception.UnsupportedFileException;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;

@Service
public class DataValidationService {

    // Valida la extensión a partir del NOMBRE del archivo (no del File físico,
    // que puede no existir en disco cuando el MultipartFile vive en memoria).
    public void validateExtension(String filename) {
        if (filename == null || !(filename.endsWith(".xls") || filename.endsWith(".xlsx"))) {
            throw new IllegalArgumentException("El archivo debe tener extensión .xls o .xlsx");
        }
    }

    // Abre el contenido real como Excel. Si el archivo no es un Excel válido
    // (p. ej. un PDF renombrado a .xlsx), WorkbookFactory falla aquí.
    public Workbook parseWorkbook(InputStream file) {
        try {
            return WorkbookFactory.create(file);
        } catch (IOException e) {
            throw new UnsupportedFileException("El archivo no es un archivo de Excel válido");
        }
    }

    public boolean parseState(String state) {
        String s = state.toLowerCase().strip();
        if (s.equals("sí") || s.equals("true") || s.equals("si")) {
            return true;
        } else if (s.equals("no") || s.equals("false")) {
            return false;
        } else {
            throw new IllegalArgumentException(state + " no es un valor válido, debe ser Sí, No, true o false");
        }
    }

    // Valida un RUT chileno por su dígito verificador (módulo 11).
    // Acepta con o sin puntos y guion: "12.345.678-9", "12345678-9", "123456789".
    public void validateRut(String rut) {
        if (rut == null || rut.isBlank()) {
            throw new IllegalArgumentException("el RUT está vacío");
        }
        String limpio = rut.replace(".", "").replace("-", "").strip().toUpperCase();
        if (limpio.length() < 2) {
            throw new IllegalArgumentException("el RUT '" + rut + "' es demasiado corto");
        }

        String cuerpo = limpio.substring(0, limpio.length() - 1);
        char dvIngresado = limpio.charAt(limpio.length() - 1);

        if (!cuerpo.matches("\\d+")) {
            throw new IllegalArgumentException("el RUT '" + rut + "' contiene caracteres no numéricos");
        }

        int suma = 0;
        int factor = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += Character.getNumericValue(cuerpo.charAt(i)) * factor;
            factor = (factor == 7) ? 2 : factor + 1;
        }
        int resto = 11 - (suma % 11);
        char dvEsperado;
        if (resto == 11) {
            dvEsperado = '0';
        } else if (resto == 10) {
            dvEsperado = 'K';
        } else {
            dvEsperado = Character.forDigit(resto, 10);
        }

        if (dvIngresado != dvEsperado) {
            throw new IllegalArgumentException("el RUT '" + rut + "' tiene un dígito verificador incorrecto");
        }
    }
}