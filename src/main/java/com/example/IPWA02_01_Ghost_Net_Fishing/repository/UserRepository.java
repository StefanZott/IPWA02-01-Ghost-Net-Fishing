package com.example.IPWA02_01_Ghost_Net_Fishing.repository;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository-Schnittstelle für User (Personen).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}
