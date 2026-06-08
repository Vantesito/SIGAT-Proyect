package com.example.sigat.backend.controller;

import com.example.sigat.backend.model.Point;
import com.example.sigat.backend.service.MapService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/map")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('USER')")
public class MapController {
    private final MapService mapService;

    public MapController(MapService mapService) {
        this.mapService = mapService;
    }

    @GetMapping("points/active")
    public ResponseEntity<?> getPointsByDisease(@RequestParam Long disease){
        List<Point> points = mapService.getActivePointsByDisease(disease);
        return new ResponseEntity<>(points, HttpStatus.OK);
    }
}
