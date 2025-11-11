package com.example.IPWA02_01_Ghost_Net_Fishing.dto;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNetStatus;

public class GhostNetResponse {

    private Long id;
    private Double latitude;
    private Double longitude;
    private Double size;
    private GhostNetStatus status;

    public GhostNetResponse(Long id, Double latitude, Double longitude, Double size, GhostNetStatus status) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.size = size;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getSize() {
        return size;
    }

    public void setSize(Double size) {
        this.size = size;
    }

    public GhostNetStatus getStatus() {
        return status;
    }

    public void setStatus(GhostNetStatus status) {
        this.status = status;
    }
}
