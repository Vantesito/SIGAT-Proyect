package com.example.sigat.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Table(name = "point_modification_values")
@Entity
@Data
@Getter
@Setter
public class PointModificationValues {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JoinColumn(name = "point_action_id")
    private PointAction pointAction;
}
