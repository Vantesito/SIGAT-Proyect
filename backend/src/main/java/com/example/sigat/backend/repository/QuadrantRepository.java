package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.Quadrant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuadrantRepository extends JpaRepository<Quadrant, Long> {
    Optional<Quadrant> findByColIndexAndRowIndex(Long colIndex, Long rowIndex);
}