package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.NotificationRecipient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Long> {
    List<NotificationRecipient> findByUser_Email(String userEmail);
}