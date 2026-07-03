package com.example.sigat.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Locale;
import java.util.Map;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

    // Centros aproximados de las ciudades soportadas, usados solo para acotar
    // la búsqueda a un radio razonable (~25 km) y evitar que Nominatim
    // devuelva coincidencias en comunas o regiones lejanas con nombre de
    // calle parecido (p. ej. "Caupolicán" existe en varias comunas de Chile).
    private static final Map<String, double[]> CENTROS_CIUDAD = Map.ofEntries(
            Map.entry("arica", new double[]{-18.4783, -70.3126}),
            Map.entry("iquique", new double[]{-20.2307, -70.1503}),
            Map.entry("antofagasta", new double[]{-23.6500, -70.4000}),
            Map.entry("copiapo", new double[]{-27.3668, -70.3314}),
            Map.entry("la serena", new double[]{-29.9027, -71.2500}),
            Map.entry("valparaiso", new double[]{-33.0472, -71.6197}),
            Map.entry("vina del mar", new double[]{-33.0245, -71.5518}),
            Map.entry("santiago", new double[]{-33.4569, -70.6483}),
            Map.entry("rancagua", new double[]{-34.1708, -70.7444}),
            Map.entry("talca", new double[]{-35.4264, -71.6554}),
            Map.entry("chillan", new double[]{-36.6066, -72.1034}),
            Map.entry("concepcion", new double[]{-36.8270, -73.0498}),
            Map.entry("temuco", new double[]{-38.7397, -72.5904}),
            Map.entry("valdivia", new double[]{-39.8142, -73.2459}),
            Map.entry("osorno", new double[]{-40.5736, -73.1333}),
            Map.entry("puerto montt", new double[]{-41.4693, -72.9411}),
            Map.entry("coyhaique", new double[]{-45.5712, -72.0666}),
            Map.entry("punta arenas", new double[]{-53.1638, -70.9171})
    );

    // Medio ancho de la caja de búsqueda en grados (~0.25° ≈ 25-28 km en Chile continental)
    private static final double RADIO_GRADOS = 0.25;

    // Convierte una dirección de calle en coordenadas [lat, lng] usando Nominatim (OpenStreetMap).
    public double[] geocode(String address, String city) {
        double[] centro = CENTROS_CIUDAD.get(normalizar(city));
        String direccionNormalizada = normalizarNumeracion(address);

        // Intento 1: búsqueda estructurada (calle/ciudad por separado), más
        // precisa que texto libre, acotada a la ciudad si la conocemos.
        double[] resultado = buscarEstructurado(direccionNormalizada, city, centro);
        if (resultado != null) return resultado;

        // Intento 2 (fallback): si la búsqueda estructurada estricta no
        // encontró nada (p. ej. domicilio con formato irregular), reintenta
        // con texto libre pero manteniendo la caja geográfica, para que
        // igual quede acotado a la ciudad correcta.
        return buscarLibre(direccionNormalizada, city, centro);
    }

    private double[] buscarEstructurado(String address, String city, double[] centro) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(NOMINATIM_URL)
                .queryParam("format", "json")
                .queryParam("limit", 1)
                .queryParam("countrycodes", "cl")
                .queryParam("street", address)
                .queryParam("city", city)
                .queryParam("country", "Chile");

        aplicarCaja(builder, centro);

        return ejecutar(builder);
    }

    private double[] buscarLibre(String address, String city, double[] centro) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(NOMINATIM_URL)
                .queryParam("format", "json")
                .queryParam("limit", 1)
                .queryParam("countrycodes", "cl")
                .queryParam("q", address + ", " + city + ", Chile");

        aplicarCaja(builder, centro);

        double[] resultado = ejecutar(builder);
        if (resultado == null) {
            throw new IllegalArgumentException("no se encontró la dirección ingresada");
        }
        return resultado;
    }

    // Restringe la búsqueda a una caja alrededor del centro de la ciudad
    // (bounded=1 fuerza a Nominatim a preferir resultados dentro de la caja).
    private void aplicarCaja(UriComponentsBuilder builder, double[] centro) {
        if (centro == null) return; // ciudad no reconocida: sin acotar
        double lat = centro[0];
        double lng = centro[1];
        String viewbox = String.format(Locale.US, "%f,%f,%f,%f",
                lng - RADIO_GRADOS, lat + RADIO_GRADOS, lng + RADIO_GRADOS, lat - RADIO_GRADOS);
        builder.queryParam("viewbox", viewbox).queryParam("bounded", 1);
    }

    private double[] ejecutar(UriComponentsBuilder builder) {
        URI uri = builder.build().encode().toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "SIGAT/1.0 (proyecto academico)");
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<NominatimResult[]> response;
        try {
            response = restTemplate.exchange(uri, HttpMethod.GET, entity, NominatimResult[].class);
        } catch (RestClientException e) {
            throw new IllegalArgumentException("no se pudo contactar el servicio de geolocalización (intente más tarde)");
        }

        NominatimResult[] body = response.getBody();
        if (body == null || body.length == 0) {
            return null;
        }

        try {
            double lat = Double.parseDouble(body[0].lat());
            double lng = Double.parseDouble(body[0].lon());
            return new double[]{lat, lng};
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("la respuesta de geolocalización no fue válida");
        }
    }

    // Quita ceros a la izquierda de los números de casa (p. ej. "0650" -> "650").
    // Es una convención de numeración chilena que casi nunca está reflejada
    // así en OpenStreetMap; con el cero puesto, Nominatim no encuentra el
    // número exacto y termina emparejando con resultados muy alejados.
    // No toca palabras (nombres de calle), solo tokens puramente numéricos.
    private String normalizarNumeracion(String address) {
        if (address == null) return address;
        return address.replaceAll("\\b0+(\\d+)\\b", "$1");
    }

    private String normalizar(String ciudad) {
        if (ciudad == null) return "";
        return ciudad.toLowerCase(Locale.US)
                .replace("á", "a").replace("é", "e").replace("í", "i")
                .replace("ó", "o").replace("ú", "u")
                .strip();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NominatimResult(String lat, String lon) {}
}