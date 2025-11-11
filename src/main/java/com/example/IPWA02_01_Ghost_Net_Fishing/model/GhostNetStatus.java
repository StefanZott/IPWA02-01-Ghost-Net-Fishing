package com.example.IPWA02_01_Ghost_Net_Fishing.model;

/**
 * Erlaubte Statuswerte gem. DB-Constraint.
 */
public enum GhostNetStatus {
    REPORTED,      // Gemeldet
    SCHEDULED,     // Bergung bevorstehend
    RECOVERED,     // Geborgen
    CANCELLED      // Verschollen/abgebrochen
}
