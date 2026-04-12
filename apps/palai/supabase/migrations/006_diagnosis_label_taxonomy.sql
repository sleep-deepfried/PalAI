-- Narrow diagnosis labels to match AI prompt (HEALTHY, SHEATH_BLIGHT, TUNGRO, RICE_BLAST).
--
-- PostgreSQL often stores label checks as "(label = ANY (ARRAY[...]))", not "IN (...)",
-- so pattern-based drops miss the constraint. Drop every CHECK on `scans`, fix data,
-- then re-add the same checks as 001_initial (label + confidence + severity).

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.scans'::regclass
      AND c.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE scans DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Strip BOM / zero-width spaces (looks like RICE_BLAST in UI but fails CHECK)
UPDATE scans
SET label = trim(both from
  replace(
    replace(
      replace(replace(label, chr(8203), ''), chr(8204), ''),
      chr(8205),
      ''
    ),
    chr(65279),
    ''
  )
);

UPDATE scans SET label = 'RICE_BLAST' WHERE label IN ('BLAST', 'blast', 'Blast');
UPDATE scans SET label = 'SHEATH_BLIGHT' WHERE label IN ('BROWN_SPOT', 'brown_spot');
UPDATE scans SET label = 'TUNGRO' WHERE label IN ('BACTERIAL_LEAF_BLIGHT', 'bacterial_leaf_blight');

-- Case-insensitive / collapsed spelling (e.g. accidental spaces)
UPDATE scans
SET label = 'RICE_BLAST'
WHERE lower(replace(replace(label, ' ', ''), '_', '')) IN ('riceblast', 'blast');

UPDATE scans
SET label = 'SHEATH_BLIGHT'
WHERE lower(replace(replace(label, ' ', ''), '_', '')) IN ('brownspot', 'sheathblight');

UPDATE scans
SET label = 'TUNGRO' WHERE lower(replace(label, ' ', '')) = 'tungro';
UPDATE scans
SET label = 'HEALTHY' WHERE lower(replace(label, ' ', '')) = 'healthy';

UPDATE scans
SET label = 'SHEATH_BLIGHT'
WHERE label NOT IN ('HEALTHY', 'SHEATH_BLIGHT', 'TUNGRO', 'RICE_BLAST');

ALTER TABLE scans ADD CONSTRAINT scans_label_check CHECK (
  label IN (
    'HEALTHY',
    'SHEATH_BLIGHT',
    'TUNGRO',
    'RICE_BLAST'
  )
);

ALTER TABLE scans ADD CONSTRAINT scans_confidence_check CHECK (confidence >= 0 AND confidence <= 1);

ALTER TABLE scans ADD CONSTRAINT scans_severity_check CHECK (severity IN ('LOW', 'MODERATE', 'HIGH'));
