package com.psylink.backend.repository;

import com.psylink.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User,Integer> {
    User findByUser_email();
}
