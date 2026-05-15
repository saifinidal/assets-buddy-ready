
-- Role enum + helpers
DO $w$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','super_stockist','stockist','master','agent','sub_agent','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $w$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_id VARCHAR(20) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone VARCHAR(20),
  balance DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(10) DEFAULT 'active',
  parent_id UUID REFERENCES public.profiles(id),
  share DECIMAL(5,2) DEFAULT 0,
  commission DECIMAL(5,2) DEFAULT 0,
  kyc VARCHAR(10) DEFAULT 'pending',
  vip_level text NOT NULL DEFAULT 'bronze',
  referral_code text UNIQUE,
  referred_by uuid,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deposits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, amount DECIMAL(12,2) NOT NULL, method VARCHAR(30), status VARCHAR(10) DEFAULT 'pending', utr VARCHAR(50), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.withdrawals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, amount DECIMAL(12,2) NOT NULL, method VARCHAR(30), status VARCHAR(10) DEFAULT 'pending', bank_info VARCHAR(100), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.bets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL REFERENCES public.profiles(id), match_event varchar NOT NULL, selection varchar NOT NULL, odds numeric NOT NULL DEFAULT 1.0, stake numeric NOT NULL DEFAULT 0, bet_type varchar NOT NULL DEFAULT 'back', result varchar DEFAULT 'pending', profit numeric DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL REFERENCES public.profiles(id), description text NOT NULL, type varchar NOT NULL DEFAULT 'deposit', credit numeric DEFAULT 0, debit numeric DEFAULT 0, balance numeric DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.live_matches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sport text NOT NULL DEFAULT 'cricket', sport_icon text, league text, team1 text NOT NULL, team2 text NOT NULL, score1 text DEFAULT '', score2 text DEFAULT '', status text DEFAULT 'live', team1_back numeric DEFAULT 0, team1_lay numeric DEFAULT 0, team2_back numeric DEFAULT 0, team2_lay numeric DEFAULT 0, draw_back numeric DEFAULT 0, draw_lay numeric DEFAULT 0, is_live boolean DEFAULT true, sort_order int DEFAULT 0, event_id text, match_time timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.casino_icons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), icon_type text NOT NULL, key text NOT NULL, image_url text, sort_order int DEFAULT 0, created_at timestamptz DEFAULT now(), UNIQUE(icon_type, key));
CREATE TABLE IF NOT EXISTS public.casino_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES public.profiles(id), game_id text, game_name text, provider text, balance_before numeric, balance_after numeric, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.market_odds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id text NOT NULL, match_event text NOT NULL, sport text NOT NULL DEFAULT 'cricket', selection text NOT NULL, back_odd numeric DEFAULT 1.9, lay_odd numeric DEFAULT 2.0, sort_order int DEFAULT 0, is_suspended boolean DEFAULT false, auto_generated boolean DEFAULT false, open_date timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), UNIQUE(event_id, selection));
CREATE TABLE IF NOT EXISTS public.audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_profile_id uuid REFERENCES public.profiles(id), action text NOT NULL, target text, details jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.game_launch_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES public.profiles(id), game_id text, game_name text, provider text, status text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.kyc_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, document_type text NOT NULL DEFAULT 'aadhaar', document_number text, front_image_url text, back_image_url text, selfie_url text, status text NOT NULL DEFAULT 'pending', admin_note text, reviewed_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.payment_accounts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type varchar DEFAULT 'upi', label varchar DEFAULT '', upi_id varchar, bank_name varchar, account_number varchar, ifsc_code varchar, holder_name varchar, is_active boolean DEFAULT true, usage_count int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.support_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, is_active boolean DEFAULT true, sort_order int DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.support_tickets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id text UNIQUE DEFAULT ('TKT-' || substr(md5(random()::text),1,6)), profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, category_id uuid REFERENCES public.support_categories(id), subject text NOT NULL, status text DEFAULT 'open', priority text DEFAULT 'normal', is_read_admin boolean DEFAULT false, is_read_user boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ticket_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE, sender_type text DEFAULT 'user', sender_name text NOT NULL, sender_profile_id uuid REFERENCES public.profiles(id), message text NOT NULL, attachment_url text, is_read boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.referral_earnings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), referrer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, referred_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, type text DEFAULT 'signup_bonus', amount numeric DEFAULT 0, description text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.agent_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, requested_role app_role NOT NULL, status VARCHAR(10) DEFAULT 'pending', message TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.settlements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL REFERENCES public.profiles(id), agent_profile_id uuid NOT NULL REFERENCES public.profiles(id), type varchar DEFAULT 'credit', amount numeric NOT NULL, reason varchar NOT NULL, note text, status varchar DEFAULT 'pending', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.commissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL REFERENCES public.profiles(id), from_profile_id uuid NOT NULL REFERENCES public.profiles(id), match_event varchar, turnover numeric DEFAULT 0, comm_rate numeric DEFAULT 0, amount numeric DEFAULT 0, type varchar DEFAULT 'match', created_at timestamptz DEFAULT now());

-- Helpers
CREATE OR REPLACE FUNCTION public.get_my_profile_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id=ur.user_id WHERE p.user_id=auth.uid() AND ur.role='admin') $$;
CREATE OR REPLACE FUNCTION public.is_agent_or_above() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id=ur.user_id WHERE p.user_id=auth.uid() AND ur.role IN ('admin','super_stockist','stockist','master','agent','sub_agent')) $$;
CREATE OR REPLACE FUNCTION public.has_role(_pid uuid, _role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_pid AND role=_role) $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casino_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casino_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_launch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Public-readable tables for anonymous home page
DROP POLICY IF EXISTS p_settings_read ON public.site_settings;
CREATE POLICY p_settings_read ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS p_settings_admin ON public.site_settings;
CREATE POLICY p_settings_admin ON public.site_settings FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_matches_read ON public.live_matches;
CREATE POLICY p_matches_read ON public.live_matches FOR SELECT USING (true);
DROP POLICY IF EXISTS p_matches_admin ON public.live_matches;
CREATE POLICY p_matches_admin ON public.live_matches FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_odds_read ON public.market_odds;
CREATE POLICY p_odds_read ON public.market_odds FOR SELECT USING (true);
DROP POLICY IF EXISTS p_odds_admin ON public.market_odds;
CREATE POLICY p_odds_admin ON public.market_odds FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_icons_read ON public.casino_icons;
CREATE POLICY p_icons_read ON public.casino_icons FOR SELECT USING (true);
DROP POLICY IF EXISTS p_icons_admin ON public.casino_icons;
CREATE POLICY p_icons_admin ON public.casino_icons FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_supcat_read ON public.support_categories;
CREATE POLICY p_supcat_read ON public.support_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS p_supcat_admin ON public.support_categories;
CREATE POLICY p_supcat_admin ON public.support_categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_pay_read ON public.payment_accounts;
CREATE POLICY p_pay_read ON public.payment_accounts FOR SELECT TO authenticated USING (is_active = true);
DROP POLICY IF EXISTS p_pay_admin ON public.payment_accounts;
CREATE POLICY p_pay_admin ON public.payment_accounts FOR ALL USING (is_admin());

-- User-owned tables
DROP POLICY IF EXISTS p_prof_self ON public.profiles;
CREATE POLICY p_prof_self ON public.profiles FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS p_prof_self_upd ON public.profiles;
CREATE POLICY p_prof_self_upd ON public.profiles FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS p_prof_admin ON public.profiles;
CREATE POLICY p_prof_admin ON public.profiles FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_roles_self ON public.user_roles;
CREATE POLICY p_roles_self ON public.user_roles FOR SELECT USING (user_id = get_my_profile_id());
DROP POLICY IF EXISTS p_roles_admin ON public.user_roles;
CREATE POLICY p_roles_admin ON public.user_roles FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_dep_own ON public.deposits;
CREATE POLICY p_dep_own ON public.deposits FOR SELECT USING (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_dep_create ON public.deposits;
CREATE POLICY p_dep_create ON public.deposits FOR INSERT WITH CHECK (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_dep_admin ON public.deposits;
CREATE POLICY p_dep_admin ON public.deposits FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_wd_own ON public.withdrawals;
CREATE POLICY p_wd_own ON public.withdrawals FOR SELECT USING (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_wd_create ON public.withdrawals;
CREATE POLICY p_wd_create ON public.withdrawals FOR INSERT WITH CHECK (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_wd_admin ON public.withdrawals;
CREATE POLICY p_wd_admin ON public.withdrawals FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_bets_own ON public.bets;
CREATE POLICY p_bets_own ON public.bets FOR SELECT USING (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_bets_create ON public.bets;
CREATE POLICY p_bets_create ON public.bets FOR INSERT WITH CHECK (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_bets_admin ON public.bets;
CREATE POLICY p_bets_admin ON public.bets FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_tx_own ON public.transactions;
CREATE POLICY p_tx_own ON public.transactions FOR SELECT USING (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_tx_admin ON public.transactions;
CREATE POLICY p_tx_admin ON public.transactions FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_kyc_own ON public.kyc_submissions;
CREATE POLICY p_kyc_own ON public.kyc_submissions FOR SELECT USING (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_kyc_create ON public.kyc_submissions;
CREATE POLICY p_kyc_create ON public.kyc_submissions FOR INSERT WITH CHECK (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_kyc_admin ON public.kyc_submissions;
CREATE POLICY p_kyc_admin ON public.kyc_submissions FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_cs_own ON public.casino_sessions;
CREATE POLICY p_cs_own ON public.casino_sessions FOR SELECT USING (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_cs_admin ON public.casino_sessions;
CREATE POLICY p_cs_admin ON public.casino_sessions FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_audit_admin ON public.audit_logs;
CREATE POLICY p_audit_admin ON public.audit_logs FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_gll_admin ON public.game_launch_logs;
CREATE POLICY p_gll_admin ON public.game_launch_logs FOR ALL USING (is_admin());
DROP POLICY IF EXISTS p_gll_own ON public.game_launch_logs;
CREATE POLICY p_gll_own ON public.game_launch_logs FOR SELECT USING (profile_id = get_my_profile_id());

DROP POLICY IF EXISTS p_st_own ON public.support_tickets;
CREATE POLICY p_st_own ON public.support_tickets FOR ALL USING (profile_id = get_my_profile_id()) WITH CHECK (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_st_admin ON public.support_tickets;
CREATE POLICY p_st_admin ON public.support_tickets FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_tm_own ON public.ticket_messages;
CREATE POLICY p_tm_own ON public.ticket_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_messages.ticket_id AND st.profile_id = get_my_profile_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_messages.ticket_id AND st.profile_id = get_my_profile_id()));
DROP POLICY IF EXISTS p_tm_admin ON public.ticket_messages;
CREATE POLICY p_tm_admin ON public.ticket_messages FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_re_own ON public.referral_earnings;
CREATE POLICY p_re_own ON public.referral_earnings FOR SELECT USING (referrer_profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_re_admin ON public.referral_earnings;
CREATE POLICY p_re_admin ON public.referral_earnings FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_ar_own ON public.agent_requests;
CREATE POLICY p_ar_own ON public.agent_requests FOR ALL USING (profile_id = get_my_profile_id()) WITH CHECK (profile_id = get_my_profile_id());
DROP POLICY IF EXISTS p_ar_admin ON public.agent_requests;
CREATE POLICY p_ar_admin ON public.agent_requests FOR ALL USING (is_admin());

DROP POLICY IF EXISTS p_set_admin ON public.settlements;
CREATE POLICY p_set_admin ON public.settlements FOR ALL USING (is_admin());
DROP POLICY IF EXISTS p_set_view ON public.settlements;
CREATE POLICY p_set_view ON public.settlements FOR SELECT USING (profile_id = get_my_profile_id() OR agent_profile_id = get_my_profile_id());

DROP POLICY IF EXISTS p_com_admin ON public.commissions;
CREATE POLICY p_com_admin ON public.commissions FOR ALL USING (is_admin());
DROP POLICY IF EXISTS p_com_own ON public.commissions;
CREATE POLICY p_com_own ON public.commissions FOR SELECT USING (profile_id = get_my_profile_id());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $f$
DECLARE _pid uuid; _did text; _name text;
BEGIN
  _did := 'USR-' || substr(md5(random()::text),1,5);
  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1));
  INSERT INTO public.profiles (user_id, display_id, name, phone, referral_code)
  VALUES (NEW.id, _did, _name, COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone), upper(substr(md5(random()::text),1,8)))
  RETURNING id INTO _pid;
  INSERT INTO public.user_roles (user_id, role) VALUES (_pid, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed essential settings
INSERT INTO public.site_settings (key, value, category) VALUES
('site_name','AnnaExch','general'), ('site_currency','INR','general'), ('site_timezone','Asia/Kolkata','general'),
('min_deposit','500','payment'), ('max_deposit','100000','payment'),
('min_withdrawal','500','payment'), ('max_withdrawal','50000','payment'), ('withdrawal_fee','2','payment'),
('registration_open','true','toggle'), ('betting_enabled','true','toggle'),
('deposit_enabled','true','toggle'), ('withdrawal_enabled','true','toggle'),
('kyc_required','true','toggle'), ('maintenance_mode','false','toggle'), ('casino_enabled','true','toggle'),
('popup_enabled','true','popup'), ('popup_title','Welcome to AnnaExch','popup'),
('popup_subtitle','Fast, Secure, Smart Experience','popup'),
('popup_button_text','Get Started Now','popup'), ('popup_button_link','/signup','popup'),
('popup_show_mode','once','popup'), ('popup_delay','1','popup'), ('popup_auto_close','0','popup'),
('ai_support_enabled','true','support'), ('support_whatsapp','','support'),
('support_telegram','','support'), ('support_floating_enabled','true','support'),
('referral_enabled','true','referral'), ('referral_signup_bonus','100','referral'), ('referral_commission_rate','2','referral')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.support_categories (name, sort_order) VALUES
('Account Issues',1),('Deposit Problem',2),('Withdrawal Problem',3),
('Betting Issue',4),('Casino Issue',5),('Technical Problem',6),('Other',7)
ON CONFLICT DO NOTHING;
