package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.PointCoordPatchRequest;
import com.example.sigat.backend.dto.PointCreationRequest;
import com.example.sigat.backend.dto.PointDiseasePatchRequest;
import com.example.sigat.backend.model.Disease;
import com.example.sigat.backend.model.Point;
import com.example.sigat.backend.model.PointAction;
import com.example.sigat.backend.model.Quadrant;
import com.example.sigat.backend.repository.DiseaseRepository;
import com.example.sigat.backend.repository.PointRepository;
import com.example.sigat.backend.repository.QuadrantRepository;
import com.example.sigat.backend.util.QuadrantUtil;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MapService {
    private final PointRepository pointRepository;
    private final DiseaseRepository diseaseRepository;
    private final HistoryService historyService;
    private final NotificationService notificationService;
    private final GeocodingService geocodingService;
    private final QuadrantRepository quadrantRepository;

    public MapService(PointRepository pointRepository, DiseaseRepository diseaseRepository,
                      HistoryService historyService, NotificationService notificationService,
                      GeocodingService geocodingService, QuadrantRepository quadrantRepository) {
        this.pointRepository = pointRepository;
        this.diseaseRepository = diseaseRepository;
        this.historyService = historyService;
        this.notificationService = notificationService;
        this.geocodingService = geocodingService;
        this.quadrantRepository = quadrantRepository;
    }

    // Reutiliza el cuadrante si ya existe; si no, lo crea.
    private Quadrant findOrCreateQuadrant(QuadrantUtil.Quadrant q) {
        return quadrantRepository.findByColIndexAndRowIndex(q.col(), q.row())
                .orElseGet(() -> {
                    Quadrant nuevo = new Quadrant();
                    nuevo.setColIndex(q.col());
                    nuevo.setRowIndex(q.row());
                    nuevo.setCenterLng(q.centerLng());
                    nuevo.setCenterLat(q.centerLat());
                    nuevo.setLabel(q.label());
                    return quadrantRepository.save(nuevo);
                });
    }

    public List<Point> getActivePointsByDisease(Long diseaseId) {
        return pointRepository.findByDisease_IdAndActiveIsTrue(diseaseId);
    }

    public List<Point> getAllActivePoints() {
        return pointRepository.findByActiveIsTrue();
    }

    public void createPoint(PointCreationRequest pcr, String username) {
        if (!diseaseRepository.existsById(pcr.disease_id())) {
            throw new IllegalArgumentException("la enfermedad asociada al punto no existe");
        }
        if (pcr.in_treatment()&&(pcr.treatment_start()==null||pcr.next_control()==null)){
            throw new IllegalArgumentException("no se incluye el inicio del tratamiento o fecha del siguiente tratamiento");
        }

        // 1. Calle -> coordenada (la dirección NO se guarda)
        double[] coords = geocodingService.geocode(pcr.address(), pcr.city());

        // 2. Coordenada -> cuadrante de 50x50 m (mismo cálculo de siempre)
        QuadrantUtil.Quadrant q = QuadrantUtil.snap(coords[0], coords[1]);

        // 3. Buscar o crear el cuadrante en su propia tabla
        Quadrant quadrant = findOrCreateQuadrant(q);

        Point point = new Point();
        point.setRut(pcr.rut());
        point.setCity(pcr.city());
        point.setInTreatment(pcr.in_treatment());
        point.setTreatmentStart(pcr.treatment_start());
        point.setNextControl(pcr.next_control());
        point.setQuadrant(quadrant);

        Disease disease = diseaseRepository.findById(pcr.disease_id()).orElseThrow();
        point.setDisease(disease);
        pointRepository.save(point);

        historyService.addUserPointCreationHistory(username, point.getId(), PointAction.ActionType.CREATION);
        notificationService.createNotificationForAllAdmins("Se ha creado un punto",
                username + " creó un punto en " + quadrant.getLabel() + " (" + pcr.city() + "), enfermedad " + disease.getName());
    }

    public void patchPointDisease(Long id, PointDiseasePatchRequest request, String username) {
        Point point = pointRepository.findById(id).orElseThrow(
                () -> new IllegalArgumentException("el punto no existe")
        );
        String old_value = "" + point.getDisease().getId();
        Disease disease = diseaseRepository.findById(request.disease_id()).orElseThrow(
                () -> new IllegalArgumentException("la enfermedad no existe")
        );
        point.setDisease(disease);
        pointRepository.save(point);
        historyService.addUserPointModHistory(username, point.getId(), PointAction.ActionType.MODIFICATION, old_value, request);
        notificationService.createNotificationForAllAdmins("Se ha modificado un punto",
                "El punto " + point.getId() + " fue modificado por " + username + ", se le asignó " + disease.getName());
    }

    // Cambiar "coordenadas" ahora significa reubicar el punto a otro cuadrante
    public void patchPointCoordinates(Long id, PointCoordPatchRequest request, String username) {
        Point point = pointRepository.findById(id).orElseThrow(
                () -> new IllegalArgumentException("el punto no existe")
        );
        String old_value = point.getQuadrant() != null ? point.getQuadrant().getLabel() : "n/a";

        // x_coordinate = longitud, y_coordinate = latitud
        QuadrantUtil.Quadrant q = QuadrantUtil.snap(request.y_coordinate(), request.x_coordinate());
        Quadrant quadrant = findOrCreateQuadrant(q);
        point.setQuadrant(quadrant);
        pointRepository.save(point);

        historyService.addUserPointModHistory(username, point.getId(), PointAction.ActionType.MODIFICATION, old_value, request);
        notificationService.createNotificationForAllAdmins("Se ha modificado un punto",
                "El punto " + point.getId() + " fue movido por " + username + " al " + quadrant.getLabel());
    }

    public Point getSinglePoint(Long id) {
        return pointRepository.findById(id).orElseThrow(
                () -> new IllegalArgumentException("el punto no existe")
        );
    }

    public void deactivatePoint(String username, Long id) {
        Point point = pointRepository.findById(id).orElseThrow(
                () -> new IllegalArgumentException("el punto no existe")
        );
        if (!point.isActive()) {
            throw new IllegalArgumentException("el punto ya está desactivado");
        }
        point.setActive(false);
        pointRepository.save(point);
        historyService.addUserPointDeactivationHistory(username, point.getId());
        notificationService.createNotificationForAllAdmins("Se ha desactivado un punto",
                "El punto " + point.getId() + " fue desactivado por " + username);
    }
}