package com.example.sigat.backend.model;


import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Table(name = "point_action")
@Entity
@Data
@Getter
@Setter
public class PointAction {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "datetime")
    private OffsetDateTime dateTime;
    @Column(name = "action_type")
    @Enumerated(EnumType.STRING)
    private ActionType actionType;
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "point_modification_values_id")
    private PointModificationValues pointModificationValues;
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
    @OneToOne
    @JoinColumn(name = "point_id")
    private Point point;

    public enum ActionType{
        CREATION,
        DELETION,
        MODIFICATION,
        DEACTIVATION
    }
}
