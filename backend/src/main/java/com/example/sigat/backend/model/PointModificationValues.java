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
    @Column(name = "affected_field")
    String affectedField;
    @Column(name = "old_value")
    String oldValue;
    @Column(name = "new_value")
    String newValue;
}
