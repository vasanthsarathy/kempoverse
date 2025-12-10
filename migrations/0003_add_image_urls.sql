-- Migration: Add image_urls column for image gallery
-- Date: 2025-12-10

ALTER TABLE entries ADD COLUMN image_urls TEXT;
