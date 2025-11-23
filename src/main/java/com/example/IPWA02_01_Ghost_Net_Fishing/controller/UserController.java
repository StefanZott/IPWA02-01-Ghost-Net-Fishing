package com.example.IPWA02_01_Ghost_Net_Fishing.controller;

import com.example.IPWA02_01_Ghost_Net_Fishing.dto.*;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.User;
import com.example.IPWA02_01_Ghost_Net_Fishing.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/user
     * Gibt alle User zurück.
     */
    @GetMapping
    public List<User> getAllUser() {
        return userService.getAllUsers();
    }

    /**
     * POST /api/register
     * Nimmt Registrierungsdaten an, validiert, hasht Passwort und speichert.
     *
     * @param req JSON-Body (username, email, password, confirm, [role])
     * @return 200 + minimale Nutzerinfo (ohne Passwort), oder 400 bei Fehlern
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request);
        RegisterResponse response = new RegisterResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                "Registrierung erfolgreich"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Login eines Benutzers.
     * Prüft Benutzername/Passwort und liefert Erfolg/Fehler zurück.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request); // prüft Username + Passwort
            if (user != null) {
                // Erfolg: LoginResponse mit success=true
                LoginResponse response = new LoginResponse(true, "Login erfolgreich", user.getUsername(), user.getId(), user.getRole(), user.getEmail(), user.getPhoneNumber(), user.getCreatedAt());

                return ResponseEntity.ok(response);
            } else {
                // Fehler: falsche Daten
                LoginResponse response = new LoginResponse(false, "Ungültiger Benutzername oder Passwort", null, null, null, null, null,null);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            LoginResponse response = new LoginResponse(false, "Fehler: " + e.getMessage(), null, null, null, null, null, null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Aktualisiert die Profildaten (E-Mail, Telefonnummer) eines Benutzers.
     * Aktuell noch ohne Security-Check (darf sich später nur selbst ändern).
     *
     * @param id      ID des zu ändernden Benutzers
     * @param request Payload mit neuen Werten
     * @return der aktualisierte User (als JSON)
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request
    ) {
        User updated = userService.updateUser(id, request.getEmail(), request.getPhoneNumber());
        return ResponseEntity.ok(updated);
    }
}
