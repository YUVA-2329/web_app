-- ========================================================
-- IPL TICKET BOOKING 2026 - SUPABASE POSTGRESQL SCHEMA
-- ========================================================

-- 1. DROP EXISTING TABLES (IF ANY)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;

-- 2. CREATE MATCHES TABLE
CREATE TABLE public.matches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    teams TEXT[] NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    prices JSONB NOT NULL,
    available_seats INTEGER NOT NULL DEFAULT 250,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE BOOKINGS TABLE
CREATE TABLE public.bookings (
    id BIGSERIAL PRIMARY KEY,
    match_id TEXT REFERENCES public.matches(id) ON DELETE CASCADE,
    match_name TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    stand TEXT NOT NULL,
    tickets INTEGER NOT NULL CHECK (tickets > 0),
    total INTEGER NOT NULL CHECK (total >= 0),
    user_name TEXT,
    user_email TEXT,
    user_phone TEXT,
    preference TEXT DEFAULT 'Regular',
    booked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INSERT SAMPLE MATCHES DATA
INSERT INTO public.matches (id, name, teams, date, time, venue, prices, available_seats)
VALUES
(
    '01',
    'CSK vs MI',
    ARRAY['CSK', 'MI'],
    '10 Apr 2026',
    '7:30 PM',
    'M. A. Chidambaram Stadium, Chennai',
    '{"General": 1200, "Premium": 2500, "VIP": 5000}'::jsonb,
    250
),
(
    '02',
    'RCB vs MI',
    ARRAY['RCB', 'MI'],
    '14 Apr 2026',
    '7:30 PM',
    'M. Chinnaswamy Stadium, Bengaluru',
    '{"General": 1500, "Premium": 3000, "VIP": 6000}'::jsonb,
    180
),
(
    '03',
    'DC vs CSK',
    ARRAY['DC', 'CSK'],
    '18 Apr 2026',
    '7:30 PM',
    'Arun Jaitley Stadium, Delhi',
    '{"General": 1400, "Premium": 3200, "VIP": 6500}'::jsonb,
    300
),
(
    '04',
    'RR vs RCB',
    ARRAY['RR', 'RCB'],
    '22 Apr 2026',
    '7:30 PM',
    'Sawai Mansingh Stadium, Jaipur',
    '{"General": 1800, "Premium": 3500, "VIP": 7000}'::jsonb,
    220
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES FOR PUBLIC (ANON) ACCESS
CREATE POLICY "Allow public read on matches"
ON public.matches FOR SELECT
USING (true);

CREATE POLICY "Allow public update on matches"
ON public.matches FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read on bookings"
ON public.bookings FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- 7. ENABLE REALTIME ON MATCHES AND BOOKINGS (SAFE / IDEMPOTENT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;

