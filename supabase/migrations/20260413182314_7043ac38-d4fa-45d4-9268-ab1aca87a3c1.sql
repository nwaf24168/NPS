
-- NPS New responses table
CREATE TABLE public.nps_new_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz,
  project_name text,
  building_number text,
  unit_number text,
  customer_name text,
  phone text,
  match_status text,
  nps_score integer,
  satisfaction_score integer,
  sales_score integer,
  delivery_commitment_score integer,
  documents_received text,
  finishing_notes_score integer,
  engineer_score integer,
  maintenance_score integer,
  open_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_new_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "NPS new readable" ON public.nps_new_responses FOR SELECT USING (true);
CREATE POLICY "NPS new insertable" ON public.nps_new_responses FOR INSERT WITH CHECK (true);

-- NPS After Year responses table
CREATE TABLE public.nps_after_year_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz,
  project_name text,
  building_number text,
  unit_number text,
  customer_name text,
  phone text,
  match_status text,
  nps_score integer,
  delivery_commitment_score integer,
  documents_received text,
  finishing_quality_score integer,
  engineer_score integer,
  maintenance_score integer,
  maintenance_speed_score integer,
  communication_score integer,
  transparency_score integer,
  community_score integer,
  open_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_after_year_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "NPS after year readable" ON public.nps_after_year_responses FOR SELECT USING (true);
CREATE POLICY "NPS after year insertable" ON public.nps_after_year_responses FOR INSERT WITH CHECK (true);
