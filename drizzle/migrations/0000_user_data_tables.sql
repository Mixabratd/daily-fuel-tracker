-- Per-user settings: profile, targets, calculator inputs and setup-quiz answers
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 40),
  units text NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  target_calories integer NOT NULL DEFAULT 2000 CHECK (target_calories >= 0),
  target_protein integer NOT NULL DEFAULT 150 CHECK (target_protein >= 0),
  target_carbs integer NOT NULL DEFAULT 200 CHECK (target_carbs >= 0),
  target_fat integer NOT NULL DEFAULT 67 CHECK (target_fat >= 0),
  sex text NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female')),
  age integer NOT NULL DEFAULT 30 CHECK (age BETWEEN 1 AND 120),
  height_cm numeric NOT NULL DEFAULT 178 CHECK (height_cm > 0),
  weight_kg numeric NOT NULL DEFAULT 78 CHECK (weight_kg > 0),
  activity text NOT NULL DEFAULT 'moderate' CHECK (activity IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text NOT NULL DEFAULT 'maintain' CHECK (goal IN ('lose', 'maintain', 'gain')),
  pace_kg numeric CHECK (pace_kg IS NULL OR pace_kg > 0),
  target_weight_kg numeric CHECK (target_weight_kg IS NULL OR target_weight_kg > 0),
  birth_date date,
  diet text,
  obstacles text[] NOT NULL DEFAULT '{}',
  aims text[] NOT NULL DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings" ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own settings" ON public.user_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Food log
CREATE TABLE public.food_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  date date NOT NULL,
  meal text NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  brand text CHECK (brand IS NULL OR char_length(brand) <= 80),
  barcode text CHECK (barcode IS NULL OR char_length(barcode) <= 32),
  grams numeric NOT NULL DEFAULT 100 CHECK (grams > 0),
  kcal_per_100g numeric NOT NULL DEFAULT 0 CHECK (kcal_per_100g >= 0),
  protein_per_100g numeric NOT NULL DEFAULT 0 CHECK (protein_per_100g >= 0),
  carbs_per_100g numeric NOT NULL DEFAULT 0 CHECK (carbs_per_100g >= 0),
  fat_per_100g numeric NOT NULL DEFAULT 0 CHECK (fat_per_100g >= 0),
  fiber_per_100g numeric CHECK (fiber_per_100g IS NULL OR fiber_per_100g >= 0),
  sugar_per_100g numeric CHECK (sugar_per_100g IS NULL OR sugar_per_100g >= 0),
  sodium_per_100g numeric CHECK (sodium_per_100g IS NULL OR sodium_per_100g >= 0),
  total_kcal numeric NOT NULL DEFAULT 0,
  total_protein numeric NOT NULL DEFAULT 0,
  total_carbs numeric NOT NULL DEFAULT 0,
  total_fat numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'search', 'barcode', 'ai_estimate')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX food_log_entries_user_date_idx ON public.food_log_entries (user_id, date);
CREATE INDEX food_log_entries_user_created_idx ON public.food_log_entries (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_log_entries TO authenticated;
GRANT ALL ON public.food_log_entries TO service_role;
ALTER TABLE public.food_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own food log" ON public.food_log_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add to own food log" ON public.food_log_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own food log" ON public.food_log_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete from own food log" ON public.food_log_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Totals always follow grams × per-100 g values (rounded to 0.1)
CREATE OR REPLACE FUNCTION public.food_log_entries_set_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total_kcal := round(NEW.kcal_per_100g * NEW.grams / 100, 1);
  NEW.total_protein := round(NEW.protein_per_100g * NEW.grams / 100, 1);
  NEW.total_carbs := round(NEW.carbs_per_100g * NEW.grams / 100, 1);
  NEW.total_fat := round(NEW.fat_per_100g * NEW.grams / 100, 1);
  RETURN NEW;
END;
$$;

CREATE TRIGGER food_log_entries_totals
  BEFORE INSERT OR UPDATE ON public.food_log_entries
  FOR EACH ROW EXECUTE FUNCTION public.food_log_entries_set_totals();

-- Weigh-ins: one per user per day
CREATE TABLE public.weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  date date NOT NULL,
  weight_kg numeric NOT NULL CHECK (weight_kg > 0 AND weight_kg < 700),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_entries TO authenticated;
GRANT ALL ON public.weight_entries TO service_role;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own weigh-ins" ON public.weight_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own weigh-ins" ON public.weight_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own weigh-ins" ON public.weight_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own weigh-ins" ON public.weight_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Keep updated_at fresh on settings
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_settings_touch
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();