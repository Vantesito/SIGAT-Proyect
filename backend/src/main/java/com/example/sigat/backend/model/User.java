package com.example.sigat.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name="user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long user_id;
    @Column(name = "email")
    private String email;
    @Column(name = "password")
    private String password;
    @Column(name = "names")
    private String name;
    @Column(name = "surnames")
    private String surnames;
    @Column(name= "country")
    private String country;
    @Column(name= "region")
    private String region;
    @Column(name= "city")
    private String city;
    @Column(name= "institution")
    private String institution;
    @Column(name="rut")
    private String rut;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role = Role.USER;
    @Column(name = "active")
    private boolean active;

    public enum Role{
        USER,
        ADMIN,
    }
}
