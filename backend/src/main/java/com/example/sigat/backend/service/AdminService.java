package com.example.sigat.backend.service;

import com.example.sigat.backend.model.User;
import com.example.sigat.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {
    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        userRepository.save(user);
    }

    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(()->new IllegalArgumentException("La id especificada no fue encontrada"));
        if (!user.isActive()){
            throw new IllegalArgumentException("El usuario ya está desactivado");
        }
        user.setActive(false);
        userRepository.save(user);
    }
}
