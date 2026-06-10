package com.example.sigat.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Table(name = "notification_recipient")
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRecipient {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne
    @JoinColumn(name = "notification_id")
    private Notification notification;
    @Column(name = "accepted")
    boolean accepted;
}
