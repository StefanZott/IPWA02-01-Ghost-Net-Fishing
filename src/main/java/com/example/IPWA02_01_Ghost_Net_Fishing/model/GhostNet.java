package com.example.IPWA02_01_Ghost_Net_Fishing.model;

import jakarta.persistence.*;

/**
 * Repräsentiert ein Geisternetz (Ghost Net).
 * <p>
 * Diese Version richtet sich strikt nach schema.sql (ohne Spalte "size").
 * Koordinaten werden als DOUBLE PRECISION gespeichert (entspricht deiner letzten erfolgreichen EMF-Initialisierung).
 */
@Entity
@Table(name = "ghost_nets")
public class GhostNet {

    /** Primärschlüssel. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Breitengrad (DOUBLE PRECISION). */
    @Column(name = "latitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double latitude;

    /** Längengrad (DOUBLE PRECISION). */
    @Column(name = "longitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double longitude;

    /**
     * Status des Netzes (FOUND, CONFIRMED, RECOVERED,…).
     * Wird als String in der Spalte {@code status} gespeichert.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private GhostNetStatus status;

    // --- Getter/Setter ---

    /** @return DB-Primärschlüssel */
    public Long getId() { return id; }
    /** @param id DB-Primärschlüssel */
    public void setId(Long id) { this.id = id; }

    /** @return Breitengrad */
    public Double getLatitude() { return latitude; }
    /** @param latitude Breitengrad */
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    /** @return Längengrad */
    public Double getLongitude() { return longitude; }
    /** @param longitude Längengrad */
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    /** @return Status */
    public GhostNetStatus getStatus() { return status; }
    /** @param status Status */
    public void setStatus(GhostNetStatus status) { this.status = status; }
}
