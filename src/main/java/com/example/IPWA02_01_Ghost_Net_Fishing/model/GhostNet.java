package com.example.IPWA02_01_Ghost_Net_Fishing.model;

import jakarta.persistence.*;
import java.time.Instant;

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

    /** Breitengrad (DOUBLE PRECISION). */
    @Column(name = "latitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double latitude;

    /** Längengrad (DOUBLE PRECISION). */
    @Column(name = "longitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double longitude;

    /** Geschätzte Größe des Geisternetzes (optional). */
    @Column(name = "size", nullable = true, columnDefinition = "DOUBLE PRECISION")
    private Double size;

    /**
     * Meldende Person als reine FK-ID (users.id).
     * <p>
     * Darf null sein, wenn anonyme Meldungen erlaubt sind.
     */
    @Column(name = "reported_by_user_id", nullable = true)
    private Long reportedBy;

    @Column(name = "recovered_by_user_id", nullable = true)
    private Long recoveredBy;

    /**
     * Bergende Person (die die Bergung übernimmt) als FK-ID (users.id).
     * <p>
     * Ist null, solange sich noch niemand für die Bergung eingetragen hat.
     */
    @Column(name = "scheduled_by_user_id", nullable = true)
    private Long scheduledBy;

    /**
     * Zeitpunkt, zu dem die Bergung geplant (SCHEDULED) wurde.
     * <p>
     * Wird beim Übergang in den Status {@link GhostNetStatus#SCHEDULED}
     * automatisch gesetzt.
     */
    @Column(name = "scheduled_at", nullable = true)
    private Instant scheduledAt;

    @Column(name = "reported_at", nullable = true)
    private Instant reportedAt;

    @Column(name = "recovered_at", nullable = true)
    private Instant recoveredAt;

    @Column(name = "canceld_by_user_id", nullable = true)
    private Long canceldBy;

    @Column(name = "canceld_at", nullable = true)
    private Instant canceldAt;

    @Column(name = "updated_at", nullable = true)
    private Instant updatedAt;

    @Column(name = "created_at", nullable = true)
    private Instant createdAt;

    /**
     * Status des Geisternetzes (als String in der DB gespeichert).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GhostNetStatus status = GhostNetStatus.REPORTED;

    // --- Getter/Setter ---

    /** @return DB-Primärschlüssel */
    public Long getId() {
        return id;
    }

    /** @param id DB-Primärschlüssel */
    public void setId(Long id) {
        this.id = id;
    }

    /** @return Breitengrad */
    public Double getLatitude() {
        return latitude;
    }

    /** @param latitude Breitengrad */
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    /** @return Längengrad */
    public Double getLongitude() {
        return longitude;
    }

    /** @param longitude Längengrad */
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    /** @return geschätzte Größe */
    public Double getSize() {
        return size;
    }

    /** @param size geschätzte Größe */
    public void setSize(Double size) {
        this.size = size;
    }

    /** @return meldende Person als User-ID */
    public Long getReportedBy() {
        return reportedBy;
    }

    /** @param reportedBy meldende Person als User-ID */
    public void setReportedBy(Long reportedBy) {
        this.reportedBy = reportedBy;
    }

    /**
     * @return bergende Person (die die Bergung übernommen hat) als User-ID,
     *         oder {@code null}, wenn noch niemand eingetragen ist.
     */
    public Long getScheduledBy() {
        return scheduledBy;
    }

    /**
     * @param scheduledBy bergende Person als User-ID
     */
    public void setScheduledBy(Long scheduledBy) {
        this.scheduledBy = scheduledBy;
    }

    /**
     * Liefert den Zeitpunkt, zu dem das Geisternetz auf SCHEDULED gesetzt wurde.
     *
     * @return Zeitstempel der Terminierung oder {@code null}, falls noch nie geplant
     */
    public Instant getScheduledAt() {
        return scheduledAt;
    }

    /**
     * Setzt den Zeitpunkt, zu dem das Geisternetz auf SCHEDULED gesetzt wurde.
     *
     * @param scheduledAt Zeitstempel oder {@code null}
     */
    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    /** @return Status */
    public GhostNetStatus getStatus() {
        return status;
    }

    /** @param status Status */
    public void setStatus(GhostNetStatus status) {
        this.status = status;
    }

    public Long getRecoveredBy() {
        return recoveredBy;
    }

    public void setRecoveredBy(Long recoveredBy) {
        this.recoveredBy = recoveredBy;
    }

    public Instant getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(Instant reporteddAt) {
        this.reportedAt = reporteddAt;
    }

    public Instant getRecoveredAt() {
        return recoveredAt;
    }

    public void setRecoveredAt(Instant recoveredAt) {
        this.recoveredAt = recoveredAt;
    }

    public Long getCanceldBy() {
        return canceldBy;
    }

    public void setCanceldBy(Long canceldBy) {
        this.canceldBy = canceldBy;
    }

    public Instant getCanceldAt() {
        return canceldAt;
    }

    public void setCanceldAt(Instant canceldAt) {
        this.canceldAt = canceldAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
