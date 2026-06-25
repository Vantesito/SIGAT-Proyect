package com.example.sigat.backend.util;

public final class QuadrantUtil {

    private static final double CELL_SIZE_M = 50.0;          // tamaño de cuadrante
    private static final double METERS_PER_DEG_LAT = 111320.0;

    private QuadrantUtil() {}

    // Encaja una coordenada (lat, lng) en un cuadrante de 50x50 m.
    public static Quadrant snap(double lat, double lng) {
        double latStep = CELL_SIZE_M / METERS_PER_DEG_LAT;
        long row = (long) Math.floor(lat / latStep);
        double bandLat = (row + 0.5) * latStep; // latitud representativa de la fila

        double lngStep = CELL_SIZE_M / (METERS_PER_DEG_LAT * Math.cos(Math.toRadians(bandLat)));
        long col = (long) Math.floor(lng / lngStep);

        double centerLng = (col + 0.5) * lngStep;
        String label = "Cuadrante " + Math.abs(col) + "-" + Math.abs(row);

        return new Quadrant(col, row, centerLng, bandLat, label);
    }

    public record Quadrant(long col, long row, double centerLng, double centerLat, String label) {}
}