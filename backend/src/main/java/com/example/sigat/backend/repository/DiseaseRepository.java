package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.Disease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiseaseRepository extends JpaRepository<Disease, Long> {
    boolean existsById(Long id);
    Optional<Disease> findById(Long id);
}
