package com.example.sigat.backend.controller;

import com.example.sigat.backend.dto.AuthenticationRequest;
import com.example.sigat.backend.dto.AuthenticationResponse;
import com.example.sigat.backend.dto.RegisterRequest;
import com.example.sigat.backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Collection;

@Controller
@RequestMapping("/api/auth")
public class AuthController {
    AuthenticationManager authenticationManager;
    UserDetailsService userDetailsService;
    JwtUtil jwtUtil;
    public AuthController(AuthenticationManager authenticationManager, UserDetailsService userDetailsService,
                          JwtUtil jwtUtil){
        this.authenticationManager=authenticationManager;
        this.userDetailsService=userDetailsService;
        this.jwtUtil=jwtUtil;
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthenticationRequest authReq){
        UserDetails userDetails=userDetailsService.loadUserByUsername(authReq.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authReq.email(),
                        authReq.password()
                )
        );
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        String role = userDetails.getAuthorities().isEmpty() ? "NO_ROLE" : authorities.iterator().next().toString();
        String token = jwtUtil.generateToken(userDetails);
        return new ResponseEntity<>(new AuthenticationResponse(token,userDetails.getUsername(),role),HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request){
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
