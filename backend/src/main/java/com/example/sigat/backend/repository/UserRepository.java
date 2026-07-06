package com.example.sigat.backend.repository;

import com.example.sigat.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByRut(String rut);
    List<User> findByActiveFalseAndRole(User.Role role);
    List<User> findByActiveIsTrueAndRole(User.Role role);
}