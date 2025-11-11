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

    @PostMapping("/add")
    public ResponseEntity<GhostNetResponse> addGhostNet (@RequestBody GhostNetRequest request) {
        GhostNet ghostNet = service.add(request);

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
