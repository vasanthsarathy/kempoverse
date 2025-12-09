-- Migration: Add video_url column for YouTube embeds
-- Date: 2025-12-09

ALTER TABLE entries ADD COLUMN video_url TEXT;
