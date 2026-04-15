
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS total_characters bigint DEFAULT 0;
ALTER TABLE public.reading_progress ADD COLUMN IF NOT EXISTS current_character_index bigint DEFAULT 0;
