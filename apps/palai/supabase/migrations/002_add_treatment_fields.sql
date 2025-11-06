-- Add treatment and prevention columns to scans table
ALTER TABLE scans 
ADD COLUMN IF NOT EXISTS prevention_steps JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS treatment_steps JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]';

-- Add comments for documentation
COMMENT ON COLUMN scans.prevention_steps IS 'Array of prevention steps with titles and descriptions in EN and TL';
COMMENT ON COLUMN scans.treatment_steps IS 'Array of treatment steps with titles and descriptions in EN and TL';
COMMENT ON COLUMN scans.sources IS 'Array of source links with title and URL';

