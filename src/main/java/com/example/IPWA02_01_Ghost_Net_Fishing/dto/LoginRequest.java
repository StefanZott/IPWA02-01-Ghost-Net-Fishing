package com.example.IPWA02_01_Ghost_Net_Fishing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request-Payload für /api/login.
 */
public class LoginRequest {

    /** Gewünschter Benutzername. */
    @NotBlank
    @Size(min = 3, max = 32)
    private String username;

    /** Passwort im Klartext (wird gehasht). */
    @NotBlank @Size(min = 6, max = 100)
    private String password;

    // Getter/Setter ...
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
