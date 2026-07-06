package com.example.sigat.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Table(name = "point")
@Entity
@Data
public class Point {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "active")
    private boolean active = true;

    @Column(name = "rut")
    private String rut;

    @ManyToOne
    @JoinColumn(name = "disease_id")
    private Disease disease;

    @Column(name = "city")
    private String city;

    @Column(name = "in_treatment")
    private boolean inTreatment = false;

    @Column(name = "treatment_start")
    private LocalDate treatmentStart;

    @Column(name = "next_control")
    private LocalDate nextControl;

    // El cuadrante (con su centro y etiqueta) ahora es una entidad aparte
    @ManyToOne
    @JoinColumn(name = "quadrant_id")
    private Quadrant quadrant;
}