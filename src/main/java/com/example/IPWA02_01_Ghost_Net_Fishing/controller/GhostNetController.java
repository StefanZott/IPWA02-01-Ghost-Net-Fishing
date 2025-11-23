package com.example.IPWA02_01_Ghost_Net_Fishing.controller;

import com.example.IPWA02_01_Ghost_Net_Fishing.dto.GhostNetRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.dto.GhostNetResponse;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNet;
import com.example.IPWA02_01_Ghost_Net_Fishing.service.GhostNetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST-API-Endpunkte für GhostNets.
 */
@RestController
@RequestMapping("/api/ghostnets")
public class GhostNetController {

    private final GhostNetService service;

    public GhostNetController(GhostNetService service) {
        this.service = service;
    }

    /**
     * GET /api/ghostnets
     * Gibt alle Geisternetze zurück.
     */
    @GetMapping
    public List<GhostNet> getAllGhostNets() {
        return service.getAllGhostNets();
    }

    /**
     * Legt ein neues Geisternetz an.
     * <p>
     * Hinweis: In diesem Prototypen wird die meldende Person (Reporter)
     * über einen optionalen HTTP-Header {@code X-User-Id} übermittelt.
     * Ist der Header nicht gesetzt, wird die Meldung als anonym gespeichert.
     *
     * @param request  Request-DTO mit Koordinaten und Größe
     * @param userId   optionale User-ID des Meldenden aus dem Header {@code X-User-Id}
     * @return ResponseEntity mit GhostNetResponse und HTTP-Status 200
     */
    @PostMapping("/add")
    public ResponseEntity<GhostNetResponse> addGhostNet(
            @RequestBody GhostNetRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        GhostNet ghostNet;

        if (userId != null) {
            // Meldender Benutzer ist bekannt → Reporter-FK setzen
            ghostNet = service.add(request, userId);
        } else {
            // Keine User-ID übermittelt → anonyme Meldung
            ghostNet = service.add(request);
        }

        GhostNetResponse response = new GhostNetResponse(
                ghostNet.getId(),
                ghostNet.getLatitude(),
                ghostNet.getLongitude(),
                ghostNet.getSize(),
                ghostNet.getStatus()
        );

        return ResponseEntity.ok(response);
    }

}
