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

import java.util.List;

@Service
public class MapService {
    private final PointRepository pointRepository;
    private final DiseaseRepository diseaseRepository;
    private final HistoryService historyService;
    private final NotificationService notificationService;

    public MapService(PointRepository pointRepository, DiseaseRepository diseaseRepository, HistoryService historyService, NotificationService notificationService) {
        this.pointRepository = pointRepository;
        this.diseaseRepository = diseaseRepository;
        this.historyService = historyService;
        this.notificationService = notificationService;
    }

    public List<Point> getActivePointsByDisease(Long diseaseId) {
        return pointRepository.findByDisease_IdAndActiveIsTrue(diseaseId);
    }
    public List<Point> getAllActivePoints() {
        return pointRepository.findByActiveIsTrue();
    }

    public void createPoint(PointCreationRequest pcr, String username) {
        System.out.println(diseaseRepository.existsById(pcr.disease_id()));
        if (!diseaseRepository.existsById(pcr.disease_id())){
            throw new IllegalArgumentException("la enfermedad asociada al punto no existe");
        }
        Point point = new Point();
        point.setXCoordinate(pcr.x_coordinate());
        point.setYCoordinate(pcr.y_coordinate());
        point.setRut(pcr.rut());
        point.setCity(pcr.city());
        point.setInTreatment(pcr.in_treatment());
        point.setTreatmentStart(pcr.treatment_start());
        point.setNextControl(pcr.next_control());
        Disease disease = diseaseRepository.findById(pcr.disease_id()).orElseThrow();
        point.setDisease(disease);
        pointRepository.save(point);
        historyService.addUserPointCreationHistory(username, point.getId(), PointAction.ActionType.CREATION);
        notificationService.createNotificationForAllAdmins("Se ha creado un punto",
                username+" creó un nuevo punto con id "+point.getId()+ " y enfermedad "+disease.getName()+
                        ", sus coordenadas son ("+point.getXCoordinate()+", "+ point.getYCoordinate()+")");
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
