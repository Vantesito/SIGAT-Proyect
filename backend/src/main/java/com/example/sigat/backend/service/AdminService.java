package com.example.sigat.backend.service;

import com.example.sigat.backend.model.User;
import com.example.sigat.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {
    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

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
                .orElseThrow(() -> new IllegalArgumentException("La id especificada no fue encontrada"));
        if (user.isActive()) {
            throw new IllegalArgumentException("El usuario ya está activo");
        }
        user.setActive(true);
        userRepository.save(user);
        enviarCorreoSeguro(() -> emailService.sendAcceptedRequestEmail(user.getEmail(), user.getNames()),
                user.getEmail());
    }

    public void activate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La id especificada no fue encontrada"));
        if (user.isActive()) {
            throw new IllegalArgumentException("El usuario ya está activo");
        }
        user.setActive(true);
        userRepository.save(user);
        enviarCorreoSeguro(() -> emailService.sendReactivatedAccountEmail(user.getEmail(), user.getNames()),
                user.getEmail());
    }

    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La id especificada no fue encontrada"));
        if (!user.isActive()) {
            throw new IllegalArgumentException("El usuario ya está desactivado");
        }
        user.setActive(false);
        userRepository.save(user);
        enviarCorreoSeguro(() -> emailService.sendDeactivatedAccountEmail(user.getEmail(), user.getNames()),
                user.getEmail());
    }

    public void setAdmin(Long id, boolean admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La id especificada no fue encontrada"));
        boolean eraAdmin = user.getRole() == User.Role.ADMIN;
        user.setRole(admin ? User.Role.ADMIN : User.Role.USER);
        userRepository.save(user);

        if (admin && !eraAdmin) {
            enviarCorreoSeguro(() -> emailService.sendPromotedToAdminEmail(user.getEmail(), user.getNames()),
                    user.getEmail());
        } else if (!admin && eraAdmin) {
            enviarCorreoSeguro(() -> emailService.sendRemovedAdminEmail(user.getEmail(), user.getNames()),
                    user.getEmail());
        }
    }

    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La id especificada no fue encontrada"));
        userRepository.delete(user);
    }

    // El correo es informativo, no crítico: si Resend lo rechaza (p. ej. por
    // las restricciones del modo sandbox, que solo permite enviar a la propia
    // cuenta verificada) o falla por cualquier otra razón, la acción sobre el
    // usuario (ya guardada en la base) NO debe reportarse como fallida.
    private void enviarCorreoSeguro(Runnable envio, String destinatario) {
        try {
            envio.run();
        } catch (RuntimeException e) {
            log.warn("No se pudo enviar el correo a {}: {}", destinatario, e.getMessage());
        }
    }
}