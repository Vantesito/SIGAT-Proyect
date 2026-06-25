package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.PointCoordPatchRequest;
import com.example.sigat.backend.dto.PointDiseasePatchRequest;
import com.example.sigat.backend.model.PointAction;
import com.example.sigat.backend.model.PointModificationValues;
import com.example.sigat.backend.repository.PointActionRepository;
import com.example.sigat.backend.repository.PointRepository;
import com.example.sigat.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class HistoryService {

    private final PointActionRepository pointActionRepository;
    private final UserRepository userRepository;
    private final PointRepository pointRepository;

    public HistoryService(PointActionRepository pointActionRepository, UserRepository userRepository, PointRepository pointRepository) {
        this.pointActionRepository = pointActionRepository;
        this.userRepository = userRepository;
        this.pointRepository = pointRepository;
    }

    public List<PointAction> getUserHistory(Long userId, Integer entries) {
        List<PointAction> actions = pointActionRepository.findTop64ByUser_IdOrderByDateTimeDesc(userId);
        actions = actions.stream().limit(entries).toList();
        return actions;
    }
    public List<PointAction> getGlobalHistory() {
        return pointActionRepository.findTop100ByOrderByDateTimeDesc();
    }
    public void addUserPointModHistory(String username, Long pointId, PointAction.ActionType type, String old_value,
                                       PointCoordPatchRequest request){
        PointAction action = new PointAction();
        action.setDateTime(OffsetDateTime.now());
        action.setUser(userRepository.findByEmail(username).orElseThrow());
        action.setPoint(pointRepository.findById(pointId).orElseThrow());
        action.setActionType(type);
        PointModificationValues pmv = new PointModificationValues();
        pmv.setAffectedField("COORDINATES");
        pmv.setNewValue("("+request.x_coordinate()+", "+request.y_coordinate()+")");
        pmv.setOldValue(old_value);
        action.setPointModificationValues(pmv);
        pointActionRepository.save(action);
    }
    public void addUserPointModHistory(String username, Long pointId, PointAction.ActionType type, String old_value,
                                       PointDiseasePatchRequest request){
        PointAction action = new PointAction();
        action.setDateTime(OffsetDateTime.now());
        action.setUser(userRepository.findByEmail(username).orElseThrow());
        action.setPoint(pointRepository.findById(pointId).orElseThrow());
        action.setActionType(type);
        PointModificationValues pmv = new PointModificationValues();
        pmv.setAffectedField("COORDINATES");
        pmv.setNewValue(""+request.disease_id());
        pmv.setOldValue(old_value);
        action.setPointModificationValues(pmv);
        pointActionRepository.save(action);
    }
    public void addUserPointCreationHistory(String username, Long pointId, PointAction.ActionType type){
        PointAction action = new PointAction();
        action.setDateTime(OffsetDateTime.now());
        action.setUser(userRepository.findByEmail(username).orElseThrow());
        action.setPoint(pointRepository.findById(pointId).orElseThrow());
        action.setActionType(type);
        pointActionRepository.save(action);
    }
    public void addUserPointDeactivationHistory(String username, Long pointId){
        PointAction action = new PointAction();
        action.setDateTime(OffsetDateTime.now());
        action.setUser(userRepository.findByEmail(username).orElseThrow());
        action.setPoint(pointRepository.findById(pointId).orElseThrow());
        action.setActionType(PointAction.ActionType.DEACTIVATION);
        pointActionRepository.save(action);
    }
}
