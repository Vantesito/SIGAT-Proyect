package com.example.sigat.backend.controller;

import com.example.sigat.backend.model.User;
import com.example.sigat.backend.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
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
}
