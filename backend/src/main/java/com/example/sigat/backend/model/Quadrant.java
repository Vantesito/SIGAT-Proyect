package com.example.sigat.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(
        name = "quadrant",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_quadrant_col_row",
                columnNames = {"col_index", "row_index"}
        )
)
public class Quadrant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // 'col'/'row' son palabras reservadas en SQL, por eso col_index/row_index
    @Column(name = "col_index", nullable = false)
    private Long colIndex;

    @Column(name = "row_index", nullable = false)
    private Long rowIndex;

    @Column(name = "center_lng")
    private double centerLng;

    @Column(name = "center_lat")
    private double centerLat;

    @Column(name = "label")
    private String label;
}