package com.example.sigat.backend.controller;

import com.example.sigat.backend.model.Notification;
import com.example.sigat.backend.model.PointAction;
import com.example.sigat.backend.model.User;
import com.example.sigat.backend.service.AdminService;
import com.example.sigat.backend.service.HistoryService;
import com.example.sigat.backend.service.NotificationService;
import jakarta.websocket.server.PathParam;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    public ResponseEntity<?> getPendingUsers(){
        List<User> users = adminService.getApprovalPendingUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(Authentication authentication){
        System.out.println(authentication.isAuthenticated());
        System.out.println(authentication.getAuthorities());
        List<User> users = adminService.getAllUsers();
        return new ResponseEntity<>(users,HttpStatus.OK);
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable(name = "id") Long id){
        try {
            adminService.approve(id);
            return new ResponseEntity<>(Map.of("message","exitoso"),HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(Map.of("message",e.getMessage()),HttpStatus.BAD_REQUEST);
        }
    }
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable(name = "id") Long id){
        try {
            adminService.deactivate(id);
            return new ResponseEntity<>(Map.of("message","exitoso"),HttpStatus.OK);
        } catch (IllegalArgumentException e){
            return new ResponseEntity<>(Map.of("message",e.getMessage()),HttpStatus.BAD_REQUEST);
        }
    }
    @GetMapping("/users/{id}/history")
    public ResponseEntity<?> getUserHistory(@PathVariable Long id, @PathParam("entries") Integer entries){
        if (entries==null || entries>64){
            entries=64;
        }
        List<PointAction> actions = historyService.getUserHistory(id,entries);
        return new ResponseEntity<>(actions,HttpStatus.OK);
    }
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        List<Notification> notifications = notificationService.getNotifications(userDetails.getUsername());
        return new ResponseEntity<>(notifications, HttpStatus.OK);
    }
}
