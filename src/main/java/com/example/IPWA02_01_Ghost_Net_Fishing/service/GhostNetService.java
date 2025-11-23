package com.example.IPWA02_01_Ghost_Net_Fishing.service;

import com.example.IPWA02_01_Ghost_Net_Fishing.dto.GhostNetRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNet;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNetStatus;
import com.example.IPWA02_01_Ghost_Net_Fishing.repository.GhostNetRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Geschäftslogik für Geisternetze.
 * <p>
 * Verantwortlichkeiten:
 * <ul>
 *   <li>Serverseitige Vorgaben setzen (z. B. Default-Status REPORTED)</li>
 *   <li>Validierung eingehender Daten</li>
 *   <li>Optional: Reporter setzen (aus Login-Context), niemals aus dem Request übernehmen</li>
 * </ul>
 */
@Service
public class GhostNetService {

    private final GhostNetRepository repository;

    /**
     * Konstruktor-Injektion des Repositories.
     *
     * @param repository JPA-Repository für {@link GhostNet}
     */
    public GhostNetService(GhostNetRepository repository) {
        this.repository = repository;
    }

    /**
     * Liefert alle Geisternetze zurück.
     *
     * @return Liste aller {@link GhostNet}-Entities
     */
    public List<GhostNet> getAllGhostNets() {
        return repository.findAll();
    }

    /**
     * Legt ein Geisternetz an – ohne Reporter (z. B. anonyme Meldung).
     * <p>
     * Achtung: Wenn die DB-Spalte {@code reported_by_user_id} NOT NULL ist,
     * schlägt dieser Weg fehl. In diesem Fall nutze die Überladung mit {@code currentUserId}
     * oder erlaube NULL in der DB-Spalte.
     *
     * @param request Request-DTO (Latitude/Longitude/Size)
     * @return persistiertes {@link GhostNet}
     * @throws IllegalArgumentException bei Validierungsfehlern
     */
    public GhostNet add(GhostNetRequest request) {
        // delegiere an Variante mit explizitem Reporter (hier: keiner)
        return add(request, null);
    }

    /**
     * Legt ein Geisternetz an – Reporter kann (optional) serverseitig gesetzt werden.
     * <p>
     * Wichtige Regeln:
     * <ul>
     *   <li>ID wird niemals aus dem Request übernommen (DB generiert)</li>
     *   <li>Status wird serverseitig auf {@link GhostNetStatus#REPORTED} gesetzt</li>
     *   <li>Reporter wird nur aus dem Server-Kontext gesetzt (z. B. Session/JWT),
     *       niemals aus dem Request</li>
     * </ul>
     *
     * @param request       Request-DTO (Latitude/Longitude/Size)
     * @param currentUserId Optional: ID des eingeloggten Users; {@code null} für anonym
     * @return persistiertes {@link GhostNet}
     * @throws IllegalArgumentException bei Validierungs- oder Integritätsfehlern
     */
    public GhostNet add(GhostNetRequest request, Long currentUserId) {
        // 1) Eingaben prüfen
        requireNonNullInRange(request.getLatitude(), -90d, 90d, "latitude");
        requireNonNullInRange(request.getLongitude(), -180d, 180d, "longitude");
        // size darf null sein – sonst ggf. Plausibilitäts-Check ergänzen

        // 2) Entity aufbauen (ID nicht aus Request übernehmen!)
        GhostNet ghostNet = new GhostNet();
        ghostNet.setLatitude(request.getLatitude());
        ghostNet.setLongitude(request.getLongitude());
        ghostNet.setSize(request.getDepth_meters()); // DTO-Feldname "depth_meters" -> Entity-Feld "size"
        ghostNet.setStatus(GhostNetStatus.REPORTED); // Client-Status ignorieren

        // 3) Reporter NUR serverseitig setzen (niemals aus Request!)
        if (currentUserId != null) {
            // --- VARIANTE A: ManyToOne(User) in der Entity vorhanden ---
            // User user = userRepository.findById(currentUserId)
            //        .orElseThrow(() -> new IllegalArgumentException("User nicht gefunden: " + currentUserId));
            // ghostNet.setReportedBy(user);

            // --- VARIANTE B: Nur FK-ID (Long) in der Entity vorhanden ---
            ghostNet.setReportedBy(currentUserId);
        }

        // 4) Persistieren
        try {
            return repository.save(ghostNet);
        } catch (DataIntegrityViolationException ex) {
            // Typische Ursachen:
            // - NOT NULL-Verletzung bei reported_by_user_id
            // - CHECK-Constraint auf status, wenn Enum/DB nicht konsistent
            throw new IllegalArgumentException("Ungültige Daten oder DB-Constraint verletzt: " + ex.getMostSpecificCause().getMessage(), ex);
        }
    }

    // -------------------------------------------------------------------------
    // Hilfsfunktionen (Validierung)
    // -------------------------------------------------------------------------

    /**
     * Stellt sicher, dass der Wert nicht {@code null} ist und innerhalb des Intervalls liegt.
     *
     * @param value   zu prüfender Wert
     * @param minIncl minimale Grenze (inklusiv)
     * @param maxIncl maximale Grenze (inklusiv)
     * @param field   Feldname für Fehlermeldungen
     * @throws IllegalArgumentException wenn Prüfung fehlschlägt
     */
    private static void requireNonNullInRange(Double value, double minIncl, double maxIncl, String field) {
        if (value == null) {
            throw new IllegalArgumentException("Feld '" + field + "' darf nicht null sein.");
        }
        if (value < minIncl || value > maxIncl) {
            throw new IllegalArgumentException(
                    "Feld '" + field + "' außerhalb des erlaubten Bereichs [" + minIncl + ", " + maxIncl + "]: " + value
            );
        }
    }
}
