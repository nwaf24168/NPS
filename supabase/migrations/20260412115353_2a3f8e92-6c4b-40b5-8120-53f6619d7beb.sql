-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  project_name TEXT,
  building_number TEXT,
  unit_number TEXT,
  delivery_date DATE,
  is_delivered BOOLEAN DEFAULT false,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  has_responded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new', 'after_year')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('nps', 'csat', 'rating', 'yes_no', 'text')),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create responses table
CREATE TABLE public.responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL
);

-- Create campaign_recipients table
CREATE TABLE public.campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded BOOLEAN DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Public read for surveys and questions
CREATE POLICY "Surveys are publicly readable" ON public.surveys FOR SELECT USING (true);
CREATE POLICY "Questions are publicly readable" ON public.questions FOR SELECT USING (true);

-- Customers
CREATE POLICY "Customers readable" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Customers insertable" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers updatable" ON public.customers FOR UPDATE USING (true);

-- Responses
CREATE POLICY "Responses insertable" ON public.responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Responses readable" ON public.responses FOR SELECT USING (true);

-- Answers
CREATE POLICY "Answers insertable" ON public.answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Answers readable" ON public.answers FOR SELECT USING (true);

-- Campaigns
CREATE POLICY "Campaigns readable" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Campaigns insertable" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Campaigns updatable" ON public.campaigns FOR UPDATE USING (true);
CREATE POLICY "Campaigns deletable" ON public.campaigns FOR DELETE USING (true);

-- Campaign recipients
CREATE POLICY "Campaign recipients readable" ON public.campaign_recipients FOR SELECT USING (true);
CREATE POLICY "Campaign recipients insertable" ON public.campaign_recipients FOR INSERT WITH CHECK (true);
CREATE POLICY "Campaign recipients updatable" ON public.campaign_recipients FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_customers_token ON public.customers(token);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_questions_survey ON public.questions(survey_id);
CREATE INDEX idx_responses_customer ON public.responses(customer_id);
CREATE INDEX idx_responses_survey ON public.responses(survey_id);
CREATE INDEX idx_answers_response ON public.answers(response_id);
CREATE INDEX idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();