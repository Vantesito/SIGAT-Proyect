package com.example.sigat.backend.controller;

import com.example.sigat.backend.dto.AuthenticationRequest;
import com.example.sigat.backend.dto.AuthenticationResponse;
import com.example.sigat.backend.dto.RegisterRequest;
import com.example.sigat.backend.service.AuthService;
import com.example.sigat.backend.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    AuthenticationManager authenticationManager;
    UserDetailsService userDetailsService;
    JwtUtil jwtUtil;
    AuthService authService;

    @ExceptionHandler
    public ResponseEntity<Map<String,String>> handleIllegalArgument(IllegalArgumentException e){
        return new ResponseEntity<>(Map.of("message",e.getMessage()),HttpStatus.UNPROCESSABLE_ENTITY);
    }
    @ExceptionHandler(exception = HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String,String>> handleHttpMessageNotReadable(){
        return new ResponseEntity<>(Map.of("message", "El objeto JSON no tiene el formato correcto"), HttpStatus.BAD_REQUEST);
    }

    public AuthController(AuthenticationManager authenticationManager, UserDetailsService userDetailsService,
                          JwtUtil jwtUtil, AuthService authService){
        this.authenticationManager=authenticationManager;
        this.userDetailsService=userDetailsService;
        this.jwtUtil=jwtUtil;
        this.authService = authService;
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthenticationRequest authReq){
        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(authReq.email());
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
        } catch (DisabledException e) {
            // Cuenta existe pero está inactiva: recién registrada (pendiente de
            // aprobación) o desactivada por un admin. No se genera token.
            return new ResponseEntity<>(
                    Map.of("message", "Tu cuenta aún no ha sido aprobada o se encuentra desactivada."),
                    HttpStatus.FORBIDDEN);
        } catch (BadCredentialsException | UsernameNotFoundException e) {
            // No distinguimos "usuario no existe" de "contraseña incorrecta" en
            // el mensaje, para no revelar si un correo está o no registrado.
            return new ResponseEntity<>(
                    Map.of("message", "Credenciales incorrectas."),
                    HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequest request){
        authService.register(request);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }
}