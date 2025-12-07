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

    public GhostNetStatus getStatus() {
        return status;
    }

    public void setStatus(GhostNetStatus status) {
        this.status = status;
    }
}
