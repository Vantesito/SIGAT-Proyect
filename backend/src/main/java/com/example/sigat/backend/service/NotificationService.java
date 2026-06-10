package com.example.sigat.backend.service;

import com.example.sigat.backend.model.Notification;
import com.example.sigat.backend.model.NotificationRecipient;
import com.example.sigat.backend.model.User;
import com.example.sigat.backend.repository.NotificationRecipientRepository;
import com.example.sigat.backend.repository.NotificationRepository;
import com.example.sigat.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class NotificationService {
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRecipientRepository notificationRecipientRepository, UserRepository userRepository, NotificationRepository notificationRepository) {
        this.notificationRecipientRepository = notificationRecipientRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getNotifications(String username){
        return notificationRecipientRepository.findByUser_Email(username)
                .stream().map(NotificationRecipient::getNotification).filter(Objects::nonNull)
                .toList();
    }
    public void createNotificationForAllAdmins(String title, String content){
        Notification notification = new Notification();
        notification.setCreatedAt(OffsetDateTime.now());
        notification.setTitle(title);
        notification.setContent(content);
        notificationRepository.save(notification);
        List<User> admins = getAllActiveAdmins();
        for (User user : admins) {
            NotificationRecipient notificationRecipient = new NotificationRecipient();
            notificationRecipient.setNotification(notification);
            notificationRecipient.setUser(user);
            notificationRecipientRepository.save(notificationRecipient);
        }
    }
    private List<User> getAllActiveAdmins(){
        return userRepository.findByActiveIsTrueAndRole(User.Role.ADMIN);
    }
}
