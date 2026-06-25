package com.example.sigat.backend.service;

import com.example.sigat.backend.model.User;
import com.example.sigat.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    public AdminService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public List<User> getApprovalPendingUsers() {
        return userRepository.findByActiveFalseAndRole(User.Role.USER);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void approve(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(()->new IllegalArgumentException("La id especificada no fue encontrada"));
        if (user.isActive()){
            throw new IllegalArgumentException("El usuario ya está activo");
        }
        user.setActive(true);
        emailService.sendAcceptedRequestEmail(user.getEmail(),user.getNames());
        userRepository.save(user);
    }

    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(()->new IllegalArgumentException("La id especificada no fue encontrada"));
        if (!user.isActive()){
            throw new IllegalArgumentException("El usuario ya está desactivado");
        }
        user.setActive(false);
        emailService.sendRegisterRequestEmail(user.getEmail(),user.getNames());
        userRepository.save(user);
    }
    public void setAdmin(Long id, boolean admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La id especificada no fue encontrada"));
        user.setRole(admin ? User.Role.ADMIN : User.Role.USER);
        userRepository.save(user);
    }

    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La id especificada no fue encontrada"));
        userRepository.delete(user);
    }
}
