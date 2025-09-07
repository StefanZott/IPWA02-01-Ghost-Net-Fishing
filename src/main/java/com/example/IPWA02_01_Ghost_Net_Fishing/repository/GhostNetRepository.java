package com.example.IPWA02_01_Ghost_Net_Fishing.repository;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Datenbankzugriff für GhostNets.
 */
@Repository
public interface GhostNetRepository extends JpaRepository<GhostNet, Long> {
}
