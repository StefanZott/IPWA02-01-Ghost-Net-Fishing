package com.example.IPWA02_01_Ghost_Net_Fishing.service;

import com.example.IPWA02_01_Ghost_Net_Fishing.dto.LoginRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.dto.RegisterRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.dto.UpdateUserRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.User;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.UserRole;
import com.example.IPWA02_01_Ghost_Net_Fishing.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service-Klasse für User-Operationen.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Liefert alle User zurück.
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Registriert einen neuen Benutzer.
     * @param req RegisterRequest mit username, email, password, confirm, role
     * @return gespeicherter Benutzer
     * @throws IllegalArgumentException bei Validierungsfehlern
     */
    @Transactional
    public User register(RegisterRequest req) {
        if (!req.getPassword().equals(req.getConfirm())) {
            throw new IllegalArgumentException("Passwörter stimmen nicht überein.");
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("Benutzername bereits vergeben.");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("E-Mail bereits vergeben.");
        }

        User u = new User();
        u.setUsername(req.getUsername().trim());
        u.setEmail(req.getEmail().trim().toLowerCase());
        u.setRole(req.getRole() == null ? UserRole.REPORTER : req.getRole());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));

        try {
            return userRepository.save(u);
        } catch (DataIntegrityViolationException ex) {
            // Fallback, falls DB-Constraints anschlagen
            throw new IllegalArgumentException("Benutzername oder E-Mail existieren bereits.", ex);
        }
    }

    @Transactional
    public User login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElse(null);

        if (user != null && passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return user;
        }
        return null; // Falsche Daten
    }

    /**
     * Aktualisiert die E-Mail-Adresse und Telefonnummer eines Benutzers.
     * Führt intern ein SELECT + UPDATE über JPA aus.
     *
     * @param id          ID des zu ändernden Benutzers
     * @param email       neue E-Mail-Adresse (kann null sein)
     * @param phoneNumber neue Telefonnummer (kann null sein)
     * @return der aktualisierte User
     */
    @Transactional
    public User updateUser(Long id, String email, String phoneNumber) {
        // 1) User laden oder Fehler werfen, falls nicht vorhanden
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id " + id));

        // 2) E-Mail nur prüfen/setzen, wenn sich etwas ändert
        if (email != null && !email.equals(user.getEmail())) {
            // Prüfen, ob E-Mail bereits vergeben ist
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("E-Mail-Adresse wird bereits verwendet.");
            }
            user.setEmail(email);
        }

        // 3) Telefonnummer auch null-able
        user.setPhoneNumber(phoneNumber);

        // 4) Speichern (führt ein UPDATE aus) und aktualisierten User zurückgeben
        return userRepository.save(user);
    }

}