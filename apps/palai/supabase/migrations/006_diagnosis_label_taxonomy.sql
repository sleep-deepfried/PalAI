-- Narrow diagnosis labels to match AI prompt (HEALTHY, SHEATH_BLIGHT, TUNGRO, RICE_BLAST).
-- Map legacy rows before replacing the CHECK constraint.

UPDATE scans SET label = 'RICE_BLAST' WHERE label = 'BLAST';
UPDATE scans SET label = 'SHEATH_BLIGHT' WHERE label = 'BROWN_SPOT';
UPDATE scans SET label = 'TUNGRO' WHERE label = 'BACTERIAL_LEAF_BLIGHT';

ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_label_check;

ALTER TABLE scans ADD CONSTRAINT scans_label_check CHECK (
  label IN (
    'HEALTHY',
    'SHEATH_BLIGHT',
    'TUNGRO',
    'RICE_BLAST'
  )
);
