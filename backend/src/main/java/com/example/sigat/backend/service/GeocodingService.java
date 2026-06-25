package com.example.sigat.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

    // Convierte una dirección de calle en coordenadas [lat, lng] usando Nominatim (OpenStreetMap).
    public double[] geocode(String address, String city) {
        String query = address + ", " + city + ", Chile";

        URI uri = UriComponentsBuilder.fromHttpUrl(NOMINATIM_URL)
                .queryParam("q", query)
                .queryParam("format", "json")
                .queryParam("limit", 1)
                .queryParam("countrycodes", "cl")
                .build().encode().toUri();

        // Nominatim exige un User-Agent identificable
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "SIGAT/1.0 (proyecto academico)");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<NominatimResult[]> response =
                restTemplate.exchange(uri, HttpMethod.GET, entity, NominatimResult[].class);

        NominatimResult[] body = response.getBody();
        if (body == null || body.length == 0) {
            throw new IllegalArgumentException("No se pudo geolocalizar la dirección ingresada");
        }
        double lat = Double.parseDouble(body[0].lat());
        double lng = Double.parseDouble(body[0].lon());
        return new double[]{lat, lng};
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NominatimResult(String lat, String lon) {}
}