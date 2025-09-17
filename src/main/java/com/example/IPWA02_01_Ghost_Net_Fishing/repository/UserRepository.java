package com.example.IPWA02_01_Ghost_Net_Fishing.repository;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository-Schnittstelle für User (Personen).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Findet einen Benutzer per Benutzername.
     * @param username Name
     * @return Optional Benutzer
     */
    Optional<User> findByUsername(String username);

    /**
     * Prüft, ob ein Benutzername bereits existiert.
     */
    boolean existsByUsername(String username);

    /**
     * Prüft, ob eine E-Mail bereits existiert.
     */
    boolean existsByEmail(String email);
}
