-- =====================================================================
-- BulkFlow TMS (Current Phase) - Supabase/PostgreSQL schema
-- Ordered for clean, single-pass execution
-- =====================================================================

-- ---------- 0) Helpers ----------
-- (Nothing here yet; keep for extensions if needed)

-- ---------- 1) Reference: roles ----------
CREATE TABLE IF NOT EXISTS roles (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL  -- 'Dispatcher','Customer','Carrier','Driver'
);

-- Seed roles
INSERT INTO roles (name) VALUES
  ('Dispatcher'), ('Customer'), ('Carrier'), ('Driver')
ON CONFLICT (name) DO NOTHING;

-- ---------- 2) Reference: equipment types ----------
CREATE TABLE IF NOT EXISTS equipment_types (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- (Optional) seed a few common bulk types; extend as needed
INSERT INTO equipment_types (name) VALUES
  ('Hopper Bottom'),
  ('End Dump'),
  ('Walking Floor'),
  ('Liquid Tanker'),
  ('Pneumatic Tank'),
  ('Flatbed'),
  ('Belt Trailer')
ON CONFLICT (name) DO NOTHING;

-- ---------- 3) Customers & Locations ----------
CREATE TABLE IF NOT EXISTS customers (
  id                      BIGSERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,
  primary_contact_name    TEXT,
  primary_contact_email   TEXT,
  primary_contact_phone   TEXT,
  credit_limit            NUMERIC(12,2),
  payment_terms           SMALLINT,              -- e.g. 30 for Net 30
  consolidated_invoicing  BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID,  -- FK added later
  updated_by              UUID   -- FK added later
);

CREATE TABLE IF NOT EXISTS customer_locations (
  id             BIGSERIAL PRIMARY KEY,
  customer_id    BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  location_name  TEXT,
  address_line1  TEXT,
  address_line2  TEXT,
  city           TEXT,
  state          VARCHAR(2),
  postal_code    TEXT,
  country        TEXT DEFAULT 'USA',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID,  -- FK added later
  updated_by     UUID   -- FK added later
);

CREATE TABLE IF NOT EXISTS customer_documents (
  id           BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL,         -- e.g. Contract, NDA
  file_url     TEXT NOT NULL,         -- Supabase Storage path/URL
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by  UUID                   -- FK added later
);

-- ---------- 4) Carriers ----------
CREATE TABLE IF NOT EXISTS carriers (
  id                      BIGSERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,
  mc_number               TEXT,
  primary_contact_name    TEXT,
  primary_contact_email   TEXT,
  primary_contact_phone   TEXT,
  operating_states        TEXT[] DEFAULT '{}'::TEXT[],
  dnu_flag                BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID,  -- FK added later
  updated_by              UUID   -- FK added later
);

CREATE TABLE IF NOT EXISTS carrier_equipment_types (
  carrier_id        BIGINT NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
  PRIMARY KEY (carrier_id, equipment_type_id)
);

CREATE TABLE IF NOT EXISTS carrier_documents (
  id           BIGSERIAL PRIMARY KEY,
  carrier_id   BIGINT NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL,       -- e.g. Insurance, Contract
  file_url     TEXT NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by  UUID                 -- FK added later
);

-- ---------- 5) Fleet: trucks, trailers, drivers ----------
CREATE TABLE IF NOT EXISTS trucks (
  id              BIGSERIAL PRIMARY KEY,
  truck_number    TEXT NOT NULL UNIQUE,
  license_plate   TEXT UNIQUE,
  maintenance_due DATE,
  status          TEXT NOT NULL DEFAULT 'Available',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID,  -- FK added later
  updated_by      UUID,  -- FK added later
  CONSTRAINT chk_truck_status CHECK (status IN ('Available','In Use','Maintenance'))
);

CREATE TABLE IF NOT EXISTS trailers (
  id                BIGSERIAL PRIMARY KEY,
  trailer_number    TEXT NOT NULL UNIQUE,
  license_plate     TEXT,
  equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id),
  maintenance_due   DATE,
  status            TEXT NOT NULL DEFAULT 'Available',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,  -- FK added later
  updated_by        UUID,  -- FK added later
  CONSTRAINT chk_trailer_status CHECK (status IN ('Available','In Use','Maintenance'))
);

CREATE TABLE IF NOT EXISTS drivers (
  id                  BIGSERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  phone               TEXT,
  license_number      TEXT,
  license_expiry_date DATE,
  medical_card_expiry DATE,
  status              TEXT NOT NULL DEFAULT 'Active',
  truck_id            BIGINT REFERENCES trucks(id),
  user_id             UUID,  -- FK to users added later (driver portal user)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID,  -- FK added later
  updated_by          UUID,  -- FK added later
  CONSTRAINT chk_driver_status CHECK (status IN ('Active','On Leave','Inactive'))
);

-- one driver per truck at a time
CREATE UNIQUE INDEX IF NOT EXISTS ux_driver_truck ON drivers(truck_id) WHERE truck_id IS NOT NULL;

-- ---------- 6) Billing: invoices (before loads) ----------
CREATE TABLE IF NOT EXISTS invoices (
  id              BIGSERIAL PRIMARY KEY,
  invoice_number  TEXT UNIQUE,
  customer_id     BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  date_created    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  total_amount    NUMERIC(12,2),
  is_paid         BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date       DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID,  -- FK added later
  updated_by      UUID   -- FK added later
);

-- ---------- 7) Loads (shipments) ----------
CREATE TABLE IF NOT EXISTS loads (
  id                        BIGSERIAL PRIMARY KEY,
  customer_id               BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  origin_location_id        BIGINT NOT NULL REFERENCES customer_locations(id),
  destination_location_id   BIGINT NOT NULL REFERENCES customer_locations(id),
  equipment_type_id         INTEGER NOT NULL REFERENCES equipment_types(id),
  commodity                 TEXT,
  weight                    NUMERIC(10,2),
  status                    TEXT NOT NULL DEFAULT 'Pending Pickup',
  pickup_date               DATE,
  delivery_date             DATE,
  -- assignment (external OR internal OR unassigned)
  carrier_id                BIGINT REFERENCES carriers(id) ON DELETE RESTRICT,
  driver_id                 BIGINT REFERENCES drivers(id) ON DELETE RESTRICT,
  truck_id                  BIGINT REFERENCES trucks(id) ON DELETE RESTRICT,
  trailer_id                BIGINT REFERENCES trailers(id) ON DELETE RESTRICT,
  -- financials
  rate_customer             NUMERIC(10,2),
  rate_carrier              NUMERIC(10,2),
  invoice_id                BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  -- docs
  pod_uploaded              BOOLEAN DEFAULT FALSE,
  -- audit
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                UUID,  -- FK added later
  updated_by                UUID,  -- FK added later
  CONSTRAINT chk_load_status CHECK (
    status IN ('Pending Pickup','In Transit','Delivered','Cancelled')
  ),
  CONSTRAINT chk_assignment_type CHECK (
    (carrier_id IS NOT NULL AND driver_id IS NULL AND truck_id IS NULL AND trailer_id IS NULL)
    OR (carrier_id IS NULL AND driver_id IS NOT NULL AND truck_id IS NOT NULL AND trailer_id IS NOT NULL)
    OR (carrier_id IS NULL AND driver_id IS NULL AND truck_id IS NULL AND trailer_id IS NULL)
  )
);

-- Helpful indexes for filters
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_customer ON loads(customer_id);
CREATE INDEX IF NOT EXISTS idx_loads_carrier ON loads(carrier_id);
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX IF NOT EXISTS idx_loads_delivery_date ON loads(delivery_date);

-- ---------- 8) Load documents ----------
CREATE TABLE IF NOT EXISTS load_documents (
  id           BIGSERIAL PRIMARY KEY,
  load_id      BIGINT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL,       -- 'POD','BOL','Other'
  file_url     TEXT NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by  UUID                 -- FK added later
);

-- ---------- 9) Bids (carrier load board) ----------
CREATE TABLE IF NOT EXISTS bids (
  id            BIGSERIAL PRIMARY KEY,
  load_id       BIGINT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  carrier_id    BIGINT NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  offered_rate  NUMERIC(10,2),
  accepted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID                 -- FK added later (carrier user)
);

-- one bid per carrier per load
CREATE UNIQUE INDEX IF NOT EXISTS bids_load_carrier_uk
  ON bids (load_id, carrier_id);


-- ---------- 10) Load communication log ----------
CREATE TABLE IF NOT EXISTS load_messages (
  id         BIGSERIAL PRIMARY KEY,
  load_id    BIGINT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  user_id    UUID,           -- FK added later
  message    TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- 11) Users (after customers/carriers exist) ----------
-- Use auth.users for identity; keep a local profile with role and optional org link
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL REFERENCES roles(name), -- 'Dispatcher','Customer','Carrier','Driver'
  customer_id BIGINT REFERENCES customers(id),
  carrier_id  BIGINT REFERENCES carriers(id),
  name        TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID,  -- FK added below
  updated_by  UUID   -- FK added below
);

-- ---------- 12) Add audit/portal FKs now that users exists ----------
-- Use DO blocks to safely add constraints only if they don't exist

-- Customers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customers_created_by') THEN
    ALTER TABLE customers ADD CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customers_updated_by') THEN
    ALTER TABLE customers ADD CONSTRAINT fk_customers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_custloc_created_by') THEN
    ALTER TABLE customer_locations ADD CONSTRAINT fk_custloc_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_custloc_updated_by') THEN
    ALTER TABLE customer_locations ADD CONSTRAINT fk_custloc_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_custdocs_uploaded_by') THEN
    ALTER TABLE customer_documents ADD CONSTRAINT fk_custdocs_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id);
  END IF;
END $$;

-- Carriers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_carriers_created_by') THEN
    ALTER TABLE carriers ADD CONSTRAINT fk_carriers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_carriers_updated_by') THEN
    ALTER TABLE carriers ADD CONSTRAINT fk_carriers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cardocs_uploaded_by') THEN
    ALTER TABLE carrier_documents ADD CONSTRAINT fk_cardocs_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id);
  END IF;
END $$;

-- Fleet
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trucks_created_by') THEN
    ALTER TABLE trucks ADD CONSTRAINT fk_trucks_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trucks_updated_by') THEN
    ALTER TABLE trucks ADD CONSTRAINT fk_trucks_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trailers_created_by') THEN
    ALTER TABLE trailers ADD CONSTRAINT fk_trailers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trailers_updated_by') THEN
    ALTER TABLE trailers ADD CONSTRAINT fk_trailers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_created_by') THEN
    ALTER TABLE drivers ADD CONSTRAINT fk_drivers_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_updated_by') THEN
    ALTER TABLE drivers ADD CONSTRAINT fk_drivers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_user_id') THEN
    ALTER TABLE drivers ADD CONSTRAINT fk_drivers_user_id FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

-- Billing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_created_by') THEN
    ALTER TABLE invoices ADD CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_updated_by') THEN
    ALTER TABLE invoices ADD CONSTRAINT fk_invoices_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

-- Loads & related
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_loads_created_by') THEN
    ALTER TABLE loads ADD CONSTRAINT fk_loads_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_loads_updated_by') THEN
    ALTER TABLE loads ADD CONSTRAINT fk_loads_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_loaddocs_uploaded_by') THEN
    ALTER TABLE load_documents ADD CONSTRAINT fk_loaddocs_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bids_created_by') THEN
    ALTER TABLE bids ADD CONSTRAINT fk_bids_created_by FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_loadmsg_user') THEN
    ALTER TABLE load_messages ADD CONSTRAINT fk_loadmsg_user FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

-- ---------- 12.5) Update driver status constraint if needed ----------
DO $$ 
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_driver_status') THEN
    ALTER TABLE drivers DROP CONSTRAINT chk_driver_status;
  END IF;
  -- Add the new constraint
  ALTER TABLE drivers ADD CONSTRAINT chk_driver_status CHECK (status IN ('Active','On Leave','Inactive'));
END $$;

-- ---------- 13) Optional convenience indexes ----------
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_carriers_dnu ON carriers(dnu_flag);
CREATE INDEX IF NOT EXISTS idx_invoices_paid ON invoices(is_paid);
