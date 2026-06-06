package com.example.sigat.backend.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final Resend resend;

    private static final String SENDER = "SIGAT <onboarding@resend.dev>";

    public EmailService(@Value("${resend.api-key}") String apiKey) {
        this.resend = buildResendClient(apiKey);
    }

    protected Resend buildResendClient(String apiKey) {
        return new Resend(apiKey);
    }

    public void sendRegisterRequestEmail(String recipient, String names) {
        String subject = "SIGAT — Formulario de registro recibido";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                    <h2 style="color: #2c7be5;">¡Hola, %s!</h2>
                    <p>Hemos recibido tu solicitud de registro en <strong>SIGAT</strong>.</p>
                    <p>Tu cuenta está actualmente <strong>pendiente de aprobación</strong>
                       por parte del administrador.</p>
                    <p>El proceso de revisión puede tomar entre
                       <strong>24 a 48 horas hábiles</strong>.</p>
                    <p>Una vez aprobada tu cuenta, recibirás un correo de confirmación
                       y podrás acceder al sistema.</p>
                    <br>
                    <p style="color: #888; font-size: 13px;">— Equipo SIGAT</p>
                </body>
                </html>
                """.formatted(names);

        send(recipient, subject, body);
    }

    public void sendAcceptedRequestEmail(String recipient, String names) {
        String subject = "SIGAT — ¡Tu cuenta ha sido aprobada!";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                    <h2 style="color: #28a745;">¡Bienvenido/a, %s!</h2>
                    <p>Tu cuenta en <strong>SIGAT</strong> ha sido
                       <strong>aprobada</strong> por el administrador.</p>
                    <p>Ya puedes iniciar sesión con tu correo electrónico y contraseña.</p>
                    <br>
                    <a href="http://localhost:3000/login"
                       style="background-color: #2c7be5; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Iniciar sesión
                    </a>
                    <br><br>
                    <p style="color: #888; font-size: 13px;">— Equipo SIGAT</p>
                </body>
                </html>
                """.formatted(names);

        send(recipient, subject, body);
    }

    private void send(String recipient, String subject, String body) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(SENDER)
                    .to(recipient)
                    .subject(subject)
                    .html(body)
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            System.out.println("Correo enviado — ID: " + response.getId());

        } catch (ResendException e) {
            throw new RuntimeException("Error al send correo a " + recipient + ": " + e.getMessage());
        }
    }
}