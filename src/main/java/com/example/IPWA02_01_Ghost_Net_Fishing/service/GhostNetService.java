package com.example.IPWA02_01_Ghost_Net_Fishing.service;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNet;
import com.example.IPWA02_01_Ghost_Net_Fishing.repository.GhostNetRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Geschäftslogik für GhostNets.
 */
@Service
public class GhostNetService {

    private final GhostNetRepository repository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public GhostNetService(GhostNetRepository repository) {
        this.repository = repository;
    }

    /**
     * Liefert alle Geisternetze zurück.
     */
    public List<GhostNet> getAllGhostNets() {
        return repository.findAll();
    }
}
