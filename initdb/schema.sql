-- person: id (BIGSERIAL), name, phone
CREATE TABLE IF NOT EXISTS person (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  phone TEXT,
  role  TEXT NOT NULL CHECK (role IN ('REPORTER','SALVOR'))
);

-- ghost_net: id, latitude, longitude, status, reporter_id -> person.id
CREATE TABLE IF NOT EXISTS ghost_net (
  id          SERIAL PRIMARY KEY,
  latitude    NUMERIC(9,6) NOT NULL,
  longitude   NUMERIC(9,6) NOT NULL,
  status      TEXT NOT NULL CHECK (
                status IN ('GEMELDET','BERGUNG_BEVORSTEHEND','GEBORGEN','VERSCHOLLEN')
              ),
  reporter_id BIGINT REFERENCES person(id) ON DELETE SET NULL
);