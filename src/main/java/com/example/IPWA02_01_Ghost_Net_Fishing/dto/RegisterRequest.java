package com.example.IPWA02_01_Ghost_Net_Fishing.dto;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request-Payload für /api/register.
 */
public class RegisterRequest {

    /** Gewünschter Benutzername. */
    @NotBlank @Size(min = 3, max = 32)
    private String username;

    /** E-Mail des Benutzers. */
    @NotBlank @Email
    private String email;

    /** Passwort im Klartext (wird gehasht). */
    @NotBlank @Size(min = 6, max = 100)
    private String password;

    /** Wiederholung des Passworts (Client-Check + Server-Check). */
    @NotBlank @Size(min = 6, max = 100)
    private String confirm;

    /** Optional: Rolle (Standard REPORTER). */
    private UserRole role = UserRole.REPORTER;

    // Getter/Setter ...
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirm() { return confirm; }
    public void setConfirm(String confirm) { this.confirm = confirm; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
}
