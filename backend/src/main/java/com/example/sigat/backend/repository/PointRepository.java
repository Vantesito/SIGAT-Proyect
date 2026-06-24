package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointRepository extends JpaRepository<Point,Long> {
    List<Point> findByDisease_IdAndActiveIsTrue(Long id);
    @Override
    <S extends Point> S save(S entity);
}
