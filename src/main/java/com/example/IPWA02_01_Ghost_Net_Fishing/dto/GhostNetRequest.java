package com.example.IPWA02_01_Ghost_Net_Fishing.dto;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNetStatus;
import jakarta.validation.constraints.NotBlank;

public class GhostNetRequest {

    @NotBlank
    private Long id;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private Double latitude;

    @NotBlank
    private Double longitude;

    @NotBlank
    private Double depth_meters;

    @NotBlank
    private GhostNetStatus status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Double getDepth_meters() {
        return depth_meters;
    }

    public void setDepth_meters(Double depth_meters) {
        this.depth_meters = depth_meters;
    }

    public GhostNetStatus getStatus() {
        return status;
    }

    public void setStatus(GhostNetStatus status) {
        this.status = status;
    }
}
