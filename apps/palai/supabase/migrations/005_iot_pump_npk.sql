-- Thesis IoT: ESP32 polls pump command via REST; web app updates pump; device posts NPK readings.
-- PoC RLS: public read on pump state for anon (device poll); authenticated users toggle pump;
-- anon may insert sensor rows (accept spam risk for demo — tighten for production).

CREATE TABLE IF NOT EXISTS iot_pump (
    id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
    pump_is_on BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iot_npk_readings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nitrogen_ppm INTEGER NOT NULL,
    phosphorus_ppm INTEGER NOT NULL,
    potassium_ppm INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO iot_pump (id, pump_is_on) VALUES ('default', FALSE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE iot_pump ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_npk_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iot_pump_select_anon_auth"
    ON iot_pump FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "iot_pump_update_authenticated"
    ON iot_pump FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "iot_npk_insert_anon"
    ON iot_npk_readings FOR INSERT
    TO anon
    WITH CHECK (TRUE);

CREATE POLICY "iot_npk_select_authenticated"
    ON iot_npk_readings FOR SELECT
    TO authenticated
    USING (TRUE);

GRANT SELECT ON iot_pump TO anon, authenticated;
GRANT UPDATE ON iot_pump TO authenticated;
GRANT INSERT ON iot_npk_readings TO anon;
GRANT SELECT ON iot_npk_readings TO authenticated;

CREATE INDEX IF NOT EXISTS idx_iot_npk_recorded_at ON iot_npk_readings (recorded_at DESC);
