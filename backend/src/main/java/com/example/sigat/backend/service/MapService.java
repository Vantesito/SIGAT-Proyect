package com.example.sigat.backend.service;

import com.example.sigat.backend.model.Point;
import com.example.sigat.backend.repository.PointRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MapService {
    private final PointRepository pointRepository;

    public MapService(PointRepository pointRepository) {
        this.pointRepository = pointRepository;
    }

    public List<Point> getActivePointsByDisease(Long diseaseId) {
        return pointRepository.findByDisease_IdAndActiveIsTrue(diseaseId);
    }
}
