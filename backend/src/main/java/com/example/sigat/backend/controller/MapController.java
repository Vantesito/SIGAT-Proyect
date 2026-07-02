package com.example.sigat.backend.controller;

import com.example.sigat.backend.dto.PointCoordPatchRequest;
import com.example.sigat.backend.dto.PointCreationRequest;
import com.example.sigat.backend.dto.PointDiseasePatchRequest;
import com.example.sigat.backend.model.Point;
import com.example.sigat.backend.service.MapService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/map")
@PreAuthorize("hasAnyRole('USER','ADMIN')")
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
    @GetMapping("points/active/all")
    public ResponseEntity<?> getAllActivePoints() {
        List<Point> points = mapService.getAllActivePoints();
        return new ResponseEntity<>(points, HttpStatus.OK);
    }
    @PostMapping("points/new")
    public ResponseEntity<?> createPoint(@AuthenticationPrincipal UserDetails ap,@RequestBody PointCreationRequest pcr){
        try {
            mapService.createPoint(pcr,ap.getUsername());
            return new ResponseEntity<>(HttpStatus.CREATED);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(e.getMessage(),HttpStatus.BAD_REQUEST);
        }
    }
    @PatchMapping("points/{id}/disease")
    public ResponseEntity<?> modifyPoint(@AuthenticationPrincipal UserDetails ap, @PathVariable("id") Long id, @RequestBody PointDiseasePatchRequest request){
        try {
            mapService.patchPointDisease(id, request,ap.getUsername());
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(e.getMessage(),HttpStatus.BAD_REQUEST);
        }
    }
    @PatchMapping("points/{id}/coordinates")
    public ResponseEntity<?> modifyPoint(@AuthenticationPrincipal UserDetails ap, @PathVariable("id") Long id, @RequestBody PointCoordPatchRequest request){
        try {
            mapService.patchPointCoordinates(id, request, ap.getUsername());
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(e.getMessage(),HttpStatus.BAD_REQUEST);
        }
    }
    @GetMapping("points/{id}")
    public ResponseEntity<?> getSinglePoint(@PathVariable Long id){
        try {
            Point point = mapService.getSinglePoint(id);
            return new ResponseEntity<>(point, HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
    @PutMapping("points/{id}/deactivate")
    public ResponseEntity<?> deactivatePoint(@AuthenticationPrincipal UserDetails ap, @PathVariable Long id){
        try {
            mapService.deactivatePoint(ap.getUsername(),id);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(Map.of("message", e.getMessage()),HttpStatus.BAD_REQUEST);
        }
    }
}
