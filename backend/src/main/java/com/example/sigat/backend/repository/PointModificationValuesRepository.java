package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.PointModificationValues;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointModificationValuesRepository extends JpaRepository<PointModificationValues,Long> {
    Optional<PointModificationValues> findByPointAction_Id(Long pointActionId);
}
