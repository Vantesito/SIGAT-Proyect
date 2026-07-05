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
    @ExceptionHandler
    public ResponseEntity<Map<String,String>> handleIllegalArgument(IllegalArgumentException e){
        return new ResponseEntity<>(Map.of("message",e.getMessage()),HttpStatus.BAD_REQUEST);
    }

    private final MapService mapService;

    public MapController(MapService mapService) {
        this.mapService = mapService;
    }

    @GetMapping("points/active")
    public ResponseEntity<List<Point>> getPointsByDisease(@RequestParam Long disease){
        List<Point> points = mapService.getActivePointsByDisease(disease);
        return new ResponseEntity<>(points, HttpStatus.OK);
    }
    @GetMapping("points/active/all")
    public ResponseEntity<List<Point>> getAllActivePoints() {
        List<Point> points = mapService.getAllActivePoints();
        return new ResponseEntity<>(points, HttpStatus.OK);
    }
    @PostMapping("points/new")
    public ResponseEntity<Void> createPoint(@AuthenticationPrincipal UserDetails ap,@RequestBody PointCreationRequest pcr){
        mapService.createPoint(pcr,ap.getUsername());
        return new ResponseEntity<>(HttpStatus.CREATED);
    }
    @PatchMapping("points/{id}/disease")
    public ResponseEntity<Void> modifyPoint(@AuthenticationPrincipal UserDetails ap, @PathVariable("id") Long id, @RequestBody PointDiseasePatchRequest request){
        mapService.patchPointDisease(id, request,ap.getUsername());
        return new ResponseEntity<>(HttpStatus.OK);
    }
    @PatchMapping("points/{id}/coordinates")
    public ResponseEntity<Void> modifyPoint(@AuthenticationPrincipal UserDetails ap, @PathVariable("id") Long id, @RequestBody PointCoordPatchRequest request){
        mapService.patchPointCoordinates(id, request, ap.getUsername());
        return new ResponseEntity<>(HttpStatus.OK);
    }
    @GetMapping("points/{id}")
    public ResponseEntity<Point> getSinglePoint(@PathVariable Long id){
        Point point = mapService.getSinglePoint(id);
        return new ResponseEntity<>(point, HttpStatus.OK);
    }
    @PutMapping("points/{id}/deactivate")
    public ResponseEntity<Void> deactivatePoint(@AuthenticationPrincipal UserDetails ap, @PathVariable Long id){
        mapService.deactivatePoint(ap.getUsername(),id);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
