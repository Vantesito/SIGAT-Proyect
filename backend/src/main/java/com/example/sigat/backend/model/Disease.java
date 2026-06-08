package com.example.sigat.backend.model;


import jakarta.persistence.*;
import lombok.Data;

@Table(name = "disease")
@Entity
@Data
public class Disease {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "name")
    private String name;
    @Column(name = "yellow_minimum")
    private Integer yellow_minimum;
    @Column(name = "red_minimum")
    private Integer red_minimum;
    @ManyToOne
    @JoinColumn(name = "disease_family_id")
    private DiseaseFamily diseaseFamily;
}
