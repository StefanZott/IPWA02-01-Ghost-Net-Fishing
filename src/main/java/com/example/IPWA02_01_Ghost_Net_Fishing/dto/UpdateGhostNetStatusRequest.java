package com.example.IPWA02_01_Ghost_Net_Fishing.dto;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNetStatus;

/**
 * DTO für das Aktualisieren des Status eines Geisternetzes.
 */
public class UpdateGhostNetStatusRequest {

    /**
     * Neuer Status des Geisternetzes.
     */
    private GhostNetStatus status;

    /**
     * ID des aktuell eingeloggten Benutzers, der die Änderung ausführt.
     */
    private Long currentUserId;

    private Long scheduledByUserId;

    private Long recoveredByUserId;

    private Long cancelledByUserId;

    public GhostNetStatus getStatus() {
        return status;
    }

    public void setStatus(GhostNetStatus status) {
        this.status = status;
    }

    public Long getCurrentUserId() {
        return currentUserId;
    }
    public void setCurrentUserId(Long currentUserId) {
        this.currentUserId = currentUserId;
    }

    public Long getScheduledByUserId() { return scheduledByUserId; }
    public void setScheduledByUserId(Long id) { this.scheduledByUserId = id; }

    public Long getRecoveredByUserId() {
        return recoveredByUserId;
    }
    public void setRecoveredByUserId(Long recoveredByUserId) {
        this.recoveredByUserId = recoveredByUserId;
    }

    public Long getCancelledByUserId() {
        return cancelledByUserId;
    }
    public void setCancelledByUserId(Long cancelledByUserId) {
        this.cancelledByUserId = cancelledByUserId;
    }
}
