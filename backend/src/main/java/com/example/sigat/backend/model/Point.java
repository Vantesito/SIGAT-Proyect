package com.example.sigat.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.Data;

@Table(name = "point")
@Entity
@Data
public class Point {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "x_coordinate")
    private double xCoordinate;
    @Column(name = "y_coordinate")
    private double yCoordinate;
    @Column(name="active")
    private boolean active=true;
    @Column(name="rut")
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
}
