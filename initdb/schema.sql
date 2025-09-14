-- =====================================================================
-- Ghost Net Fishing – Datenbankschema (PostgreSQL)
-- Kompatibel zu Spring Boot 3.5.x / Hibernate (PhysicalNamingStrategy)
-- =====================================================================

-- ---------------------------
-- Cleanup (idempotent)
-- ---------------------------
DROP TRIGGER IF EXISTS trg_set_timestamp_users ON users;
DROP FUNCTION IF EXISTS set_timestamp();
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS ghost_nets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---------------------------
-- Hilfsfunktion: updated_at pflegen
-- ---------------------------
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------
-- Tabelle: users
-- ---------------------------
CREATE TABLE users (
  id              BIGSERIAL PRIMARY KEY,
  -- Du kannst hier alternativ UUID verwenden:
  -- id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  phone_number    VARCHAR(50),

  -- aktiv / gesperrt etc.
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_users_email UNIQUE (email)
);

-- Trigger für updated_at
CREATE TRIGGER trg_set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

CREATE INDEX idx_users_last_name ON users (last_name);
CREATE INDEX idx_users_enabled   ON users (enabled);

-- ---------------------------
-- Tabelle: roles
-- ---------------------------
CREATE TABLE roles (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),

  CONSTRAINT uq_roles_name UNIQUE (name)
);

-- Standardrollen:
-- REPORTER  -> meldende Person
-- RECOVERER -> bergende Person
-- ADMIN     -> Systemadministration
INSERT INTO roles (name, description) VALUES
  ('REPORTER',  'Meldende Person'),
  ('RECOVERER', 'Bergende Person'),
  ('ADMIN',     'Administrator')
ON CONFLICT DO NOTHING;

-- ---------------------------
-- Tabelle: user_roles (n:m)
-- ---------------------------
CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user  ON user_roles (user_id);
CREATE INDEX idx_user_roles_role  ON user_roles (role_id);

-- ---------------------------
-- Tabelle: ghost_nets
-- ---------------------------
CREATE TABLE ghost_nets (
  id                 BIGSERIAL PRIMARY KEY,

  -- Fachattribute (Beispiele; passe auf deine Entity an)
  title              VARCHAR(200) NOT NULL,
  description        TEXT,
  latitude           NUMERIC(8,5) NOT NULL,   -- ~1.1m Genauigkeit
  longitude          NUMERIC(8,5) NOT NULL,   -- ~1.1m Genauigkeit
  depth_meters       NUMERIC(6,2),            -- optional
  size_estimate_m2   NUMERIC(10,2),           -- optional

  -- Status der Meldung/Bergung
  status             VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
  -- Zulässige Werte halten wir per CHECK flexibel für Hibernate:
  CONSTRAINT chk_ghost_nets_status
    CHECK (status IN ('REPORTED','CONFIRMED','SCHEDULED','RECOVERED','CANCELLED')),

  -- Beziehungen zu Personen
  reported_by_user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recovered_by_user_id BIGINT     REFERENCES users(id) ON DELETE SET NULL,

  reported_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovered_at       TIMESTAMPTZ,

  -- Audit
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ghost_nets_status     ON ghost_nets (status);
CREATE INDEX idx_ghost_nets_coords     ON ghost_nets (latitude, longitude);
CREATE INDEX idx_ghost_nets_reporter   ON ghost_nets (reported_by_user_id);
CREATE INDEX idx_ghost_nets_recoverer  ON ghost_nets (recovered_by_user_id);

CREATE TRIGGER trg_set_timestamp_ghost_nets
BEFORE UPDATE ON ghost_nets
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

-- ---------------------------
-- Beispiel-User (nur Entwicklung)
-- ---------------------------
-- Passwort-Hashs bitte aus der App (BCrypt) generieren.
-- INSERT INTO users (email, password_hash, first_name, last_name) VALUES
--   ('reporter@example.com',  '$2a$10$hash...', 'Melde', 'Person'),
--   ('recoverer@example.com', '$2a$10$hash...', 'Berge', 'Person');

-- Beispiel-Rollen-Zuweisung:
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT u.id, r.id FROM users u CROSS JOIN roles r
-- WHERE u.email='reporter@example.com' AND r.name='REPORTER';

-- ---------------------------
-- Optionale Sicht für Auswertungen
-- ---------------------------
CREATE OR REPLACE VIEW v_ghost_nets_overview AS
SELECT
  g.id,
  g.title,
  g.status,
  g.latitude,
  g.longitude,
  g.reported_at,
  g.recovered_at,
  rb.email  AS reported_by_email,
  rcb.email AS recovered_by_email
FROM ghost_nets g
JOIN users rb  ON rb.id = g.reported_by_user_id
LEFT JOIN users rcb ON rcb.id = g.recovered_by_user_id;
