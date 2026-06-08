package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.PointAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointActionRepository extends JpaRepository<PointAction,Long> {
    Optional<PointAction> findTop5ByUser_IdOrderByIdDesc(Long userId);
}