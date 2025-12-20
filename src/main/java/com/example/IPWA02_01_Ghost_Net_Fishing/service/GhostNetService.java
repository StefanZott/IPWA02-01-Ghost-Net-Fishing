package com.example.IPWA02_01_Ghost_Net_Fishing.service;

import com.example.IPWA02_01_Ghost_Net_Fishing.dto.GhostNetRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.dto.UpdateGhostNetStatusRequest;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNet;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.GhostNetStatus;
import com.example.IPWA02_01_Ghost_Net_Fishing.model.User;
import com.example.IPWA02_01_Ghost_Net_Fishing.repository.GhostNetRepository;
import com.example.IPWA02_01_Ghost_Net_Fishing.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

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

    private final GhostNetRepository ghostNetRepository;
    private final UserRepository userRepository;

    /**
     * Konstruktor-Injektion des Repositories.
     *
     * @param ghostNetRepository JPA-Repository für {@link GhostNet}
     */
    public GhostNetService(GhostNetRepository ghostNetRepository, UserRepository userRepository) {
        this.ghostNetRepository = ghostNetRepository;
        this.userRepository = userRepository;
    }

    /**
     * Liefert alle Geisternetze zurück.
     *
     * @return Liste aller {@link GhostNet}-Entities
     */
    public List<GhostNet> getAllGhostNets() {
        return ghostNetRepository.findAll();
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
        ghostNet.setReportedAt(Instant.now());
        ghostNet.setCreatedAt(Instant.now());

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
            return ghostNetRepository.save(ghostNet);
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

    /**
     * Aktualisiert Status und Planungsdaten eines Geisternetzes.
     * <p>
     * Fachlogik:
     * <ul>
     *   <li>Setzt immer den neuen Status.</li>
     *   <li>Beim Wechsel auf {@link GhostNetStatus#SCHEDULED} werden
     *       {@code scheduledAt} und {@code scheduledBy} gesetzt.</li>
     *   <li>Bei anderen Status bleiben diese Felder unverändert (Audit).</li>
     * </ul>
     *
     * @param id      ID des Geisternetzes
     * @param request Request mit neuem Status und optionaler User-ID
     * @return aktualisiertes Geisternetz
     * @throws IllegalArgumentException wenn Request oder Status ungültig sind
     */
    public GhostNet updateStatus(Long id, UpdateGhostNetStatusRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request darf nicht null sein.");
        }
        if (request.getStatus() == null) {
            throw new IllegalArgumentException("Neuer Status darf nicht null sein.");
        }

        GhostNetStatus newStatus = request.getStatus();

        GhostNet net = ghostNetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("GhostNet nicht gefunden: " + id));

        GhostNetStatus oldStatus = net.getStatus();
        net.setStatus(newStatus);
        net.setUpdatedAt(Instant.now());

        // Wenn auf SCHEDULED umgestellt wird → scheduledAt & scheduledBy setzen
        if (newStatus == GhostNetStatus.SCHEDULED) {
            Long scheduledByUserId = request.getScheduledByUserId();

            // scheduled_by_user_id nur setzen, wenn etwas übergeben wurde
            if (scheduledByUserId != null) {
                // Deine Entity hat (laut Controller) getScheduledBy()/setScheduledBy(Long)
                net.setScheduledBy(scheduledByUserId);
            }

            // Timestamp nur dann setzen, wenn er noch nicht gesetzt war
            if (oldStatus != GhostNetStatus.SCHEDULED || net.getScheduledAt() == null) {
                net.setScheduledAt(Instant.now());
            }
        }

        if (newStatus == GhostNetStatus.RECOVERED) {
            Long recoveredByUserId = request.getRecoveredByUserId();

            if (recoveredByUserId != null) {
                net.setRecoveredBy(recoveredByUserId);
            }

            if (oldStatus != GhostNetStatus.RECOVERED || net.getRecoveredAt() == null) {
                net.setRecoveredAt(Instant.now());
            }
        }

        if (newStatus == GhostNetStatus.CANCELLED) {
            Long cancelledByUserId = request.getCancelledByUserId();

            if (cancelledByUserId != null) {
                net.setCanceldBy(cancelledByUserId);
            }

            if (oldStatus != GhostNetStatus.CANCELLED || net.getCanceldAt() == null) {
                net.setCanceldAt(Instant.now());
            }
        }

        return ghostNetRepository.save(net);
    }
}
