# IPWA02-01-Ghost-Net-Fishing

## Tech-Stack

| Kategorie        | Technologie / Framework            | Beschreibung                                                                 |
|------------------|------------------------------------|-------------------------------------------------------------------------------|
| **Backend**      | Spring Boot (3.5.x)                | Framework für Webanwendungen und REST-APIs, Alternative zu JSF/CDI.          |
| **Sprache**      | Java 17                            | Programmiersprache für die gesamte Anwendung.                                |
| **Web/REST**     | Spring Web (spring-boot-starter-web) | Stellt die REST-Controller und Web-Endpunkte bereit.                          |
| **Persistenz**   | Spring Data JPA (Jakarta Persistence API, inkl. Hibernate) | ORM zur Abbildung von Java-Objekten auf die Datenbank. |
| **Datenbank**    | H2 (In-Memory)                     | Relationale In-Memory-Datenbank für Entwicklung und Tests.                    |
|                  | PostgreSQL (optional)              | Alternative relationale Datenbank für Produktivbetrieb.                       |
| **Testing**      | Spring Boot Starter Test (JUnit, AssertJ, Mockito) | Test-Frameworks für Unit- und Integrationstests.             |
| **Build/Tools**  | Maven                              | Build- und Abhängigkeitsmanagement.                                           |

## Entitäten und Attribute

### USERS
- **id** (PK, bigint)
- name (varchar)
- phone (varchar, NULL)
- email (varchar, unique)
- password_hash (varchar)
- created_at (timestamp)
- updated_at (timestamp)

### ROLES
- **name** (PK, varchar)
    - Werte: `REPORTER`, `RESCUER`, `ADMIN`

### USER_ROLES (M:N-Beziehung)
- **user_id** (FK → USERS.id)
- **role_name** (FK → ROLES.name)
- PK: (user_id, role_name)

### GHOST_NETS
- **id** (PK, bigint)
- latitude (decimal(9,6))
- longitude (decimal(9,6))
- size_m2 (integer, NULL)
- status (varchar, Werte: `REPORTED`, `SALVAGE_PLANNED`, `SALVAGED`, `MISSING`)
- reported_by_user_id (FK → USERS.id, NULL für anonym)
- reporter_name (varchar, NULL, für anonyme Meldung)
- reporter_phone (varchar, NULL)
- assigned_rescuer_id (FK → USERS.id, max. 1 Bergende Person)
- created_at (timestamp)
- updated_at (timestamp)

### LOST_REPORTS
- **id** (PK, bigint)
- ghost_net_id (FK → GHOST_NETS.id)
- reporter_user_id (FK → USERS.id, **NOT NULL**)
- comment (text, NULL)
- created_at (timestamp)

---

## Beziehungen

- USERS – USER_ROLES – ROLES → **M:N** (ein User kann mehrere Rollen haben, eine Rolle gehört zu mehreren Usern).
- USERS – GHOST_NETS (reported_by_user_id) → **1:N** (User meldet mehrere Netze, optional NULL = anonym).
- USERS – GHOST_NETS (assigned_rescuer_id) → **1:N** (User kann mehrere Netze bergen, ein Netz max. einen Bergenden).
- USERS – LOST_REPORTS → **1:N** (User kann mehrere „Verschollen“-Meldungen abgeben, keine Anonymität).
- GHOST_NETS – LOST_REPORTS → **1:N** (ein Netz kann mehrere „Verschollen“-Meldungen haben).  

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : defines

    USERS ||--o{ GHOST_NETS : reports
    USERS ||--o{ LOST_REPORTS : reports_missing
    USERS ||--o{ GHOST_NETS : assigned_rescuer

    USERS {
      int id PK
      string name
      string phone
      string email
      string password_hash
      datetime created_at
      datetime updated_at
    }

    ROLES {
      string name PK
    }

    USER_ROLES {
      int user_id FK
      string role_name FK
    }

    GHOST_NETS {
      int id PK
      float latitude
      float longitude
      int size_m2
      string status
      int reported_by_user_id FK
      string reporter_name
      string reporter_phone
      int assigned_rescuer_id FK
      datetime created_at
      datetime updated_at
    }

    LOST_REPORTS {
      int id PK
      int ghost_net_id FK
      int reporter_user_id FK
      string comment
      datetime created_at
    }
