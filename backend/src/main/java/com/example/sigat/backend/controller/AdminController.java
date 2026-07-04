package com.example.sigat.backend.controller;

import com.example.sigat.backend.dto.RoleChangeRequest;
import com.example.sigat.backend.model.Notification;
import com.example.sigat.backend.model.PointAction;
import com.example.sigat.backend.model.User;
import com.example.sigat.backend.service.AdminService;
import com.example.sigat.backend.service.HistoryService;
import com.example.sigat.backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;
    private final HistoryService historyService;
    private final NotificationService notificationService;

    public AdminController(AdminService adminService, HistoryService historyService, NotificationService notificationService) {
        this.adminService = adminService;
        this.historyService = historyService;
        this.notificationService = notificationService;
    }

    @GetMapping("/users/approval-pending")
    public ResponseEntity<?> getPendingUsers() {
        List<User> users = adminService.getApprovalPendingUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        List<User> users = adminService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable(name = "id") Long id) {
        try {
            adminService.approve(id);
            return new ResponseEntity<>(Map.of("message", "exitoso"), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    // Recibe quién ejecuta la acción para impedir que alguien se desactive
    // a sí mismo (quedaría bloqueado, y si era el único admin, sin forma de
    // revertirlo).
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@AuthenticationPrincipal UserDetails ap,
                                            @PathVariable(name = "id") Long id) {
        try {
            adminService.deactivate(id, ap.getUsername());
            return new ResponseEntity<>(Map.of("message", "exitoso"), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    // Dar / quitar privilegios de administrador. Ahora recibe quién ejecuta
    // la acción (@AuthenticationPrincipal) para que el service pueda impedir
    // que alguien se quite el rol de admin a sí mismo, sin depender del
    // frontend.
    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> setRole(@AuthenticationPrincipal UserDetails ap,
                                     @PathVariable(name = "id") Long id,
                                     @RequestBody RoleChangeRequest req) {
        try {
            adminService.setAdmin(id, req.admin(), ap.getUsername());
            return new ResponseEntity<>(Map.of("message", "exitoso"), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    // Eliminar usuario. Mismo criterio: el backend impide auto-eliminación
    // sin importar lo que muestre el frontend.
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal UserDetails ap,
                                        @PathVariable(name = "id") Long id) {
        try {
            adminService.delete(id, ap.getUsername());
            return new ResponseEntity<>(Map.of("message", "exitoso"), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/users/{id}/history")
    public ResponseEntity<?> getUserHistory(@PathVariable Long id,
                                            @RequestParam(name = "entries", required = false) Integer entries) {
        if (entries == null || entries > 64) {
            entries = 64;
        }
        List<PointAction> actions = historyService.getUserHistory(id, entries);
        return new ResponseEntity<>(actions, HttpStatus.OK);
    }

    // Historial global de todas las acciones (para la vista de historial del panel)
    @GetMapping("/history")
    public ResponseEntity<?> getGlobalHistory() {
        List<PointAction> actions = historyService.getGlobalHistory();
        return new ResponseEntity<>(actions, HttpStatus.OK);
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        List<Notification> notifications = notificationService.getNotifications(userDetails.getUsername());
        return new ResponseEntity<>(notifications, HttpStatus.OK);
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable(name = "id") Long id) {
        try {
            adminService.activate(id);
            return new ResponseEntity<>(Map.of("message", "exitoso"), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }
}
