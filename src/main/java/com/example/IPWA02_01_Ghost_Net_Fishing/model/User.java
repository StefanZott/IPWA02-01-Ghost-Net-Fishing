package com.example.IPWA02_01_Ghost_Net_Fishing.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Objects;

/**
 * Entity für Personen im System.
 * <p>
 * Personen können als Meldende ("REPORTER") oder Bergende ("SALVOR") auftreten.
 * Abgebildet wird die Tabelle {@code person} aus schema.sql.
 */
@Entity
@Table(name = "users")
public class User {

    /** Primärschlüssel (wird durch SERIAL/IDENTITY in Postgres erzeugt). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Eindeutiger Benutzername. */
    @Column(nullable = false, unique = true)
    private String username;

    /** Eindeutige E-Mail-Adresse. */
    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt-Hash des Passworts (nie Klartext speichern!). */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /** Benutzerrolle. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.REPORTER;

    /** Anlagezeitpunkt. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Getter/Setter ...

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
