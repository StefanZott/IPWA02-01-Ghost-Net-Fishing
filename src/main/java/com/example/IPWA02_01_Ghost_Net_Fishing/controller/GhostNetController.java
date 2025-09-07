package com.example.IPWA02_01_Ghost_Net_Fishing.controller;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNet;
import com.example.IPWA02_01_Ghost_Net_Fishing.service.GhostNetService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
