package com.example.IPWA02_01_Ghost_Net_Fishing.dto;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.UserRole;

/**
 * Antwort-Objekt für eine erfolgreiche Benutzerregistrierung.
 * Enthält Informationen, die nach der Registrierung an den Client
 * zurückgegeben werden sollen.
 */
public class RegisterResponse {

    private Long userId;
    private String username;
    private UserRole role;
    private String message;

    public RegisterResponse(Long userId, String username, UserRole role, String message) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public UserRole getRole() {
        return role;
    }

    public String getMessage() {
        return message;
    }
}
