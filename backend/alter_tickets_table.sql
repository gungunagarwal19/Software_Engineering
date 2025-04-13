-- Add qr_code and qr_uuid columns to the tickets table
ALTER TABLE tickets 
ADD COLUMN qr_code LONGTEXT NULL,
ADD COLUMN qr_uuid VARCHAR(255) NULL;
