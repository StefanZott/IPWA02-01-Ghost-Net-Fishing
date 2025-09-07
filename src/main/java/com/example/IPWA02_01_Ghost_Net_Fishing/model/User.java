package com.example.IPWA02_01_Ghost_Net_Fishing.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Objects;

/**
 * Entity für Personen im System.
 * <p>
 * Personen können als Meldende ("REPORTER") oder Bergende ("SALVOR") auftreten.
 * Abgebildet wird die Tabelle {@code person} aus schema.sql.
 */
@Entity
@Table(name = "person")
public class User {

    /** Primärschlüssel (wird durch SERIAL/IDENTITY in Postgres erzeugt). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Name der Person (Pflichtfeld). */
    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String name;

    /**
     * Telefonnummer der Person (optional).
     * Darf leer sein, wenn eine Person anonym meldet.
     */
    @Size(max = 50)
    @Pattern(regexp = "^[0-9+\\-()\\s]*$", message = "Ungültiges Telefonformat")
    private String phone;

    /**
     * Rolle der Person.
     * Erlaubte Werte laut schema.sql: REPORTER oder SALVOR.
     */
    @NotBlank
    @Column(nullable = false)
    private String role;

    // --- Konstruktoren ---

    protected User() {
        // Für JPA
    }

    public User(String name, String phone, String role) {
        this.name = name;
        this.phone = phone;
        this.role = role;
    }

    // --- Getter/Setter ---

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    // --- equals/hashCode/toString ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User user)) return false;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Person{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", phone='" + phone + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
