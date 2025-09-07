package com.example.IPWA02_01_Ghost_Net_Fishing.service;

import com.example.IPWA02_01_Ghost_Net_Fishing.model.User;
import com.example.IPWA02_01_Ghost_Net_Fishing.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Service-Klasse für User-Operationen.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Liefert alle User zurück.
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}