package com.example.sigat.backend.service;

import com.example.sigat.backend.model.Notification;
import com.example.sigat.backend.model.NotificationRecipient;
import com.example.sigat.backend.repository.NotificationRecipientRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class NotificationService {
    private final NotificationRecipientRepository notificationRecipientRepository;

    public NotificationService(NotificationRecipientRepository notificationRecipientRepository) {
        this.notificationRecipientRepository = notificationRecipientRepository;
    }

    public List<Notification> getNotifications(String username){
        return notificationRecipientRepository.findByUser_Email(username)
                .stream().map(NotificationRecipient::getNotification).filter(Objects::nonNull)
                .toList();
    }
}
