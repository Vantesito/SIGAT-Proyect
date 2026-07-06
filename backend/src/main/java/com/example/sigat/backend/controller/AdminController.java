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
import org.springframework.http.converter.HttpMessageNotReadableException;
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
    private final String SUCCESS="exitoso";

    @ExceptionHandler
    public ResponseEntity<Map<String,String>> handleIllegalArgument(IllegalArgumentException e){
        return new ResponseEntity<>(Map.of("message",e.getMessage()),HttpStatus.UNPROCESSABLE_ENTITY);
    }
    @ExceptionHandler(exception = HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String,String>> handleHttpMessageNotReadable(){
        return new ResponseEntity<>(Map.of("message", "El objeto JSON no tiene el formato correcto"), HttpStatus.BAD_REQUEST);
    }

    public AdminController(AdminService adminService, HistoryService historyService, NotificationService notificationService) {
        this.adminService = adminService;
        this.historyService = historyService;
        this.notificationService = notificationService;
    }

    @GetMapping("/users/approval-pending")
    public ResponseEntity<List<User>> getPendingUsers() {
        List<User> users = adminService.getApprovalPendingUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        List<User> users = adminService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<Map<String,String>> approveUser(@PathVariable(name = "id") Long id) {
        adminService.approve(id);
        return new ResponseEntity<>(Map.of("message", SUCCESS), HttpStatus.OK);
    }

    // Recibe quién ejecuta la acción para impedir que alguien se desactive
    // a sí mismo (quedaría bloqueado, y si era el único admin, sin forma de
    // revertirlo).
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String,String>> deactivateUser(@AuthenticationPrincipal UserDetails ap,
                                            @PathVariable(name = "id") Long id) {
        adminService.deactivate(id, ap.getUsername());
        return new ResponseEntity<>(Map.of("message", SUCCESS), HttpStatus.OK);
    }

    // Dar / quitar privilegios de administrador. Ahora recibe quién ejecuta
    // la acción (@AuthenticationPrincipal) para que el service pueda impedir
    // que alguien se quite el rol de admin a sí mismo, sin depender del
    // frontend.
    @PutMapping("/users/{id}/role")
    public ResponseEntity<Map<String,String>> setRole(@AuthenticationPrincipal UserDetails ap,
                                     @PathVariable(name = "id") Long id,
                                     @RequestBody RoleChangeRequest req) {
            adminService.setAdmin(id, req.admin(), ap.getUsername());
            return new ResponseEntity<>(Map.of("message", SUCCESS), HttpStatus.OK);
    }

    // Eliminar usuario. Mismo criterio: el backend impide auto-eliminación
    // sin importar lo que muestre el frontend.
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String,String>> deleteUser(@AuthenticationPrincipal UserDetails ap,
                                        @PathVariable(name = "id") Long id) {
        adminService.delete(id, ap.getUsername());
        return new ResponseEntity<>(Map.of("message", SUCCESS), HttpStatus.OK);
    }

    @GetMapping("/users/{id}/history")
    public ResponseEntity<List<PointAction>> getUserHistory(@PathVariable Long id,
                                            @RequestParam(name = "entries", required = false) Integer entries) {
        if (entries == null || entries > 64) {
            entries = 64;
        }
        List<PointAction> actions = historyService.getUserHistory(id, entries);
        return new ResponseEntity<>(actions, HttpStatus.OK);
    }

    // Historial global de todas las acciones (para la vista de historial del panel)
    @GetMapping("/history")
    public ResponseEntity<List<PointAction>> getGlobalHistory() {
        List<PointAction> actions = historyService.getGlobalHistory();
        return new ResponseEntity<>(actions, HttpStatus.OK);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        List<Notification> notifications = notificationService.getNotifications(userDetails.getUsername());
        return new ResponseEntity<>(notifications, HttpStatus.OK);
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<Map<String,String>> activateUser(@PathVariable(name = "id") Long id) {
        adminService.activate(id);
        return new ResponseEntity<>(Map.of("message", SUCCESS), HttpStatus.OK);
    }
}
