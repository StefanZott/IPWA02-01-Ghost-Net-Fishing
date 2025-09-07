package com.example.IPWA02_01_Ghost_Net_Fishing.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Eingebetteter Werttyp für Koordinaten mit DOUBLE PRECISION.
 * <p>
 * Achtung: Bei Float/Double niemals precision/scale setzen.
 */
@Embeddable
public class Coordinates {

    /** Breitengrad (Double Precision) */
    @Column(name = "latitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double latitude;

    /** Längengrad (Double Precision) */
    @Column(name = "longitude", nullable = false, columnDefinition = "DOUBLE PRECISION")
    private Double longitude;

    /** @return Breitengrad */
    public Double getLatitude() { return latitude; }
    /** @param latitude Breitengrad */
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    /** @return Längengrad */
    public Double getLongitude() { return longitude; }
    /** @param longitude Längengrad */
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
