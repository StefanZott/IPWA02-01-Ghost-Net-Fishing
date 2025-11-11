package com.example.IPWA02_01_Ghost_Net_Fishing.model;

import jakarta.persistence.*;

/**
 * Repräsentiert ein Geisternetz (Ghost Net).
 * <p>
 * Koordinaten werden als DOUBLE PRECISION gespeichert.
 */
@Entity
@Table(name = "ghost_nets")
public class GhostNet {

    /** Primärschlüssel. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Geschätzte Größe (z. B. Fläche/Volumen), kann null sein. */
    @Column(name = "size")
    private Double size;

    /** Breitengrad (DOUBLE PRECISION). */
    @Column(name = "latitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double latitude;

    /** Längengrad (DOUBLE PRECISION). */
    @Column(name = "longitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double longitude;

    /**
     * Meldende Person (User). Darf null sein, wenn anonyme Meldungen erlaubt sind.
     * <p>
     * DB-Spalte: ghost_nets.reported_by_user_id (FK auf users.id)
     */
    @ManyToOne(optional = true) // auf false stellen, wenn Reporter Pflicht ist
    @JoinColumn(name = "reported_by_user_id", nullable = true)
    private User reportedBy;

    /**
     * Status des Geisternetzes (als String in der DB gespeichert).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GhostNetStatus status = GhostNetStatus.REPORTED;

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

    /** @return Größe */
    public Double getSize() { return size; }
    /** @param size Größe */
    public void setSize(Double size) { this.size = size; }

    /** @return Status */
    public GhostNetStatus getStatus() { return status; }
    /** @param status Status */
    public void setStatus(GhostNetStatus status) { this.status = status; }

    /** @return meldende Person (User) oder null (anonym) */
    public User getReportedBy() { return reportedBy; }
    /** @param reportedBy meldende Person (User) oder null (anonym) */
    public void setReportedBy(User reportedBy) { this.reportedBy = reportedBy; }
}
