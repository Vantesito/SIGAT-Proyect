package com.example.sigat.backend.service;

import com.example.sigat.backend.dto.RegisterRequest;
import com.example.sigat.backend.model.User;
import com.example.sigat.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public void register(RegisterRequest request) {
        if (!request.email().equalsIgnoreCase(request.confirmation_email())) {
            throw new IllegalArgumentException("El e-mail no coincide con el e-mail de confirmación");
        }
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("El e-mail ingresado ya está en uso");
        }
        if (userRepository.findByRut(request.rut()).isPresent()) {
            throw new IllegalArgumentException("El RUT ingresado ya está en uso");
        }
        User user = new User();
        user.setNames(request.names());
        user.setSurnames(request.surnames());
        user.setCountry(request.country());
        user.setRegion(request.region());
        user.setCity(request.city());
        user.setEmail(request.email());
        user.setInstitution(request.institution());
        user.setActive(false);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(User.Role.USER);
        userRepository.save(user);

        // Correo de "solicitud de registro recibida"
        emailService.sendRegisterRequestEmail(user.getEmail(), user.getNames());
    }
}