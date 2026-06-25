package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.PointAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointActionRepository extends JpaRepository<PointAction,Long> {
    List<PointAction> findTop64ByUser_IdOrderByDateTimeDesc(Long userId);
    List<PointAction> findTop100ByOrderByDateTimeDesc();
}