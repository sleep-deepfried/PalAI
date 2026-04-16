-- Migration: Upgrade iot_pump to support 4 pump channels
-- Each channel can be controlled independently

-- Add new columns for pumps 2, 3, 4 (pump 1 uses existing pump_is_on)
ALTER TABLE iot_pump 
ADD COLUMN IF NOT EXISTS pump_1_on BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pump_2_on BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pump_3_on BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pump_4_on BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrate existing pump_is_on value to pump_1_on
UPDATE iot_pump SET pump_1_on = pump_is_on WHERE id = 'default';

-- Add labels for each pump (optional, for UI display)
ALTER TABLE iot_pump
ADD COLUMN IF NOT EXISTS pump_1_label TEXT DEFAULT 'Pump 1',
ADD COLUMN IF NOT EXISTS pump_2_label TEXT DEFAULT 'Pump 2',
ADD COLUMN IF NOT EXISTS pump_3_label TEXT DEFAULT 'Pump 3',
ADD COLUMN IF NOT EXISTS pump_4_label TEXT DEFAULT 'Pump 4';

-- Update the default row with sensible labels
UPDATE iot_pump SET
  pump_1_label = 'Spray Treatment',
  pump_2_label = 'Fertilizer',
  pump_3_label = 'Water',
  pump_4_label = 'Pesticide'
WHERE id = 'default';

COMMENT ON COLUMN iot_pump.pump_1_on IS 'Channel 1 relay state (GPIO 4)';
COMMENT ON COLUMN iot_pump.pump_2_on IS 'Channel 2 relay state (GPIO 16)';
COMMENT ON COLUMN iot_pump.pump_3_on IS 'Channel 3 relay state (GPIO 17)';
COMMENT ON COLUMN iot_pump.pump_4_on IS 'Channel 4 relay state (GPIO 18)';
