package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.PointCoordPatchRequest;
import com.example.sigat.backend.dto.PointCreationRequest;
import com.example.sigat.backend.model.Disease;
import com.example.sigat.backend.model.Point;
import com.example.sigat.backend.repository.DiseaseRepository;
import com.example.sigat.backend.repository.PointRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MapService {
    private final PointRepository pointRepository;
    private final DiseaseRepository diseaseRepository;

    public MapService(PointRepository pointRepository, DiseaseRepository diseaseRepository) {
        this.pointRepository = pointRepository;
        this.diseaseRepository = diseaseRepository;
    }

    public List<Point> getActivePointsByDisease(Long diseaseId) {
        return pointRepository.findByDisease_IdAndActiveIsTrue(diseaseId);
    }

    public void createPoint(PointCreationRequest pcr) {
        System.out.println(diseaseRepository.existsById(pcr.disease_id()));
        if (!diseaseRepository.existsById(pcr.disease_id())){
            throw new IllegalArgumentException("la enfermedad asociada al punto no existe");
        }
        Point point = new Point();
        point.setXCoordinate(pcr.x_coordinate());
        point.setYCoordinate(pcr.y_coordinate());
        point.setRut(pcr.rut());
        Disease disease = diseaseRepository.findById(pcr.disease_id()).orElseThrow();
        point.setDisease(disease);
        pointRepository.save(point);
    }

    public void patchPointDisease(Long id, Long disease_id) {
        Point point = pointRepository.findById(id).orElseThrow(
                ()->new IllegalArgumentException("el punto no existe")
        );
        Disease disease = diseaseRepository.findById(disease_id).orElseThrow(
                ()->new IllegalArgumentException("la enfermedad no existe")
        );
        point.setDisease(disease);
        pointRepository.save(point);
    }
    public void patchPointCoordinates(Long id, PointCoordPatchRequest request) {
        Point point = pointRepository.findById(id).orElseThrow(
                ()->new IllegalArgumentException("el punto no existe")
        );
        point.setXCoordinate(request.x_coordinate());
        point.setYCoordinate(request.y_coordinate());
        pointRepository.save(point);
    }
}
