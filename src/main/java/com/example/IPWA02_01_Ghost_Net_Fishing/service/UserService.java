package com.example.IPWA02_01_Ghost_Net_Fishing.service;

import com.example.IPWA02_01_Ghost_Net_Fishing.dto.RegisterRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.User;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.UserRole;
import com.example.IPWA02_01_Ghost_Net_Fishing.repository.UserRepository;
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
}