package com.example.sigat.backend.service;

import com.example.sigat.backend.model.PointAction;
import com.example.sigat.backend.repository.PointActionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistoryService {

    private final PointActionRepository pointActionRepository;

    public HistoryService(PointActionRepository pointActionRepository) {
        this.pointActionRepository = pointActionRepository;
    }

    public List<PointAction> getUserHistory(Long userId, Integer entries) {
        List<PointAction> actions = pointActionRepository.findTop64ByUser_IdOrderByDateTimeDesc(userId);
        actions = actions.stream().limit(entries).toList();
        return actions;
    }
}
