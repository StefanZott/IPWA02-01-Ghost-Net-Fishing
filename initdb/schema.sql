-- =====================================================================
-- Ghost Net Fishing – Datenbankschema (PostgreSQL)
-- Kompatibel zu Spring Boot 3.5.x / Hibernate (PhysicalNamingStrategy)
-- =====================================================================

-- ---------------------------
-- Cleanup (idempotent)
-- ---------------------------
DROP TRIGGER IF EXISTS trg_set_timestamp_users ON users;
DROP TRIGGER IF EXISTS trg_set_timestamp_ghost_nets ON ghost_nets;
DROP FUNCTION IF EXISTS set_timestamp();
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS ghost_nets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---------------------------
-- Tabelle: users
-- ---------------------------
CREATE TABLE users (
  id              BIGSERIAL PRIMARY KEY,
  username        VARCHAR(100) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  phone_number    VARCHAR(50),
  role            VARCHAR(50) NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_enabled ON users (enabled);

-- ---------------------------
-- Tabelle: roles
-- ---------------------------
CREATE TABLE roles (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  CONSTRAINT uq_roles_name UNIQUE (name)
);

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
  id                   BIGSERIAL PRIMARY KEY,
  latitude             NUMERIC(8,5) NOT NULL,
  longitude            NUMERIC(8,5) NOT NULL,
  status               VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
  CONSTRAINT chk_ghost_nets_status
    CHECK (status IN ('REPORTED','CONFIRMED','SCHEDULED','RECOVERED','CANCELLED')),
  reported_by_user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recovered_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reported_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovered_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size                 NUMERIC(10,2)
);

CREATE INDEX idx_ghost_nets_status     ON ghost_nets (status);
CREATE INDEX idx_ghost_nets_coords     ON ghost_nets (latitude, longitude);
CREATE INDEX idx_ghost_nets_reporter   ON ghost_nets (reported_by_user_id);
CREATE INDEX idx_ghost_nets_recoverer  ON ghost_nets (recovered_by_user_id);
