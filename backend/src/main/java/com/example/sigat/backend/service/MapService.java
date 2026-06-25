package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.PointCoordPatchRequest;
import com.example.sigat.backend.dto.PointCreationRequest;
import com.example.sigat.backend.dto.PointDiseasePatchRequest;
import com.example.sigat.backend.model.Disease;
import com.example.sigat.backend.model.Point;
import com.example.sigat.backend.model.PointAction;
import com.example.sigat.backend.repository.DiseaseRepository;
import com.example.sigat.backend.repository.PointRepository;
import org.springframework.stereotype.Service;
import com.example.sigat.backend.util.QuadrantUtil;
import java.util.List;

@Service
public class MapService {
    private final PointRepository pointRepository;
    private final DiseaseRepository diseaseRepository;
    private final HistoryService historyService;
    private final NotificationService notificationService;
    private final GeocodingService geocodingService;

    public MapService(PointRepository pointRepository, DiseaseRepository diseaseRepository,
                      HistoryService historyService, NotificationService notificationService,
                      GeocodingService geocodingService) {
        this.pointRepository = pointRepository;
        this.diseaseRepository = diseaseRepository;
        this.historyService = historyService;
        this.notificationService = notificationService;
        this.geocodingService = geocodingService;
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

        // 1. Calle -> coordenada (la dirección NO se guarda)
        double[] coords = geocodingService.geocode(pcr.address(), pcr.city());

        // 2. Coordenada -> cuadrante de 50x50 m
        QuadrantUtil.Quadrant q = QuadrantUtil.snap(coords[0], coords[1]);

        Point point = new Point();
        point.setRut(pcr.rut());
        point.setCity(pcr.city());
        point.setInTreatment(pcr.in_treatment());
        point.setTreatmentStart(pcr.treatment_start());
        point.setNextControl(pcr.next_control());
        // Guardamos solo el CENTRO del cuadrante (ya anonimizado), nunca la calle
        point.setXCoordinate(q.centerLng());
        point.setYCoordinate(q.centerLat());
        point.setQuadrantCol(q.col());
        point.setQuadrantRow(q.row());
        point.setQuadrantLabel(q.label());

        Disease disease = diseaseRepository.findById(pcr.disease_id()).orElseThrow();
        point.setDisease(disease);
        pointRepository.save(point);

        historyService.addUserPointCreationHistory(username, point.getId(), PointAction.ActionType.CREATION);
        notificationService.createNotificationForAllAdmins("Se ha creado un punto",
                username + " creó un punto en " + q.label() + " (" + pcr.city() + "), enfermedad " + disease.getName());
    }

    public void patchPointDisease(Long id, PointDiseasePatchRequest request, String username) {
        Point point = pointRepository.findById(id).orElseThrow(
                ()->new IllegalArgumentException("el punto no existe")
        );
        String old_value=""+point.getDisease().getId();
        Disease disease = diseaseRepository.findById(request.disease_id()).orElseThrow(
                ()->new IllegalArgumentException("la enfermedad no existe")
        );
        point.setDisease(disease);
        pointRepository.save(point);
        historyService.addUserPointModHistory(username, point.getId(), PointAction.ActionType.MODIFICATION, old_value,request);
        notificationService.createNotificationForAllAdmins("Se ha modificado un punto",
                "El punto "+point.getId()+" fue modificado por "+username+
                        ", se le asignó "+disease.getName());
    }
    public void patchPointCoordinates(Long id, PointCoordPatchRequest request, String username) {
        Point point = pointRepository.findById(id).orElseThrow(
                ()->new IllegalArgumentException("el punto no existe")
        );
        String old_value = "("+point.getXCoordinate()+", "+point.getYCoordinate()+")";
        point.setXCoordinate(request.x_coordinate());
        point.setYCoordinate(request.y_coordinate());
        pointRepository.save(point);
        historyService.addUserPointModHistory(username, point.getId(), PointAction.ActionType.MODIFICATION, old_value,request);
        notificationService.createNotificationForAllAdmins("Se ha modificado un punto",
                "El punto "+point.getId()+" fue modificado por "+username+
                        ", sus nuevas coordenadas son ("+point.getXCoordinate()+", "+ point.getYCoordinate()+")");
    }

    public Point getSinglePoint(Long id) {
        return pointRepository.findById(id).orElseThrow(
                ()->new IllegalArgumentException("el punto no existe")
        );
    }

    public void deactivatePoint(String username,Long id) {
        Point point = pointRepository.findById(id).orElseThrow(
                ()->new IllegalArgumentException("el punto no existe")
        );
        if (!point.isActive()){
            throw new IllegalArgumentException("el punto ya está desactivado");
        }
        point.setActive(false);
        pointRepository.save(point);
        historyService.addUserPointDeactivationHistory(username,point.getId());
        notificationService.createNotificationForAllAdmins("Se ha desactivado un punto",
                "El punto "+point.getId()+" fue desactivado por "+username);
    }

}
