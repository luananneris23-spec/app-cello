-- =============================================
-- ARCO & ALMA — Schema Supabase
-- Execute no SQL Editor do Supabase
-- =============================================

-- Tabela de perfis de usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  level TEXT DEFAULT 'iniciante', -- iniciante, intermediario, avancado
  instrument TEXT DEFAULT 'violoncelo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de progresso de escalas
CREATE TABLE scale_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scale_name TEXT NOT NULL,        -- ex: "C maior", "A menor"
  scale_type TEXT NOT NULL,        -- maior, menor_natural, menor_harmonica, menor_melodica
  difficulty_level INTEGER DEFAULT 1, -- 1 a 10
  bpm_achieved INTEGER DEFAULT 60,
  sessions_count INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,    -- 0-100
  unlocked BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões de prática
CREATE TABLE practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,      -- scale, rhythm, tuning, doutzauer, free
  scale_name TEXT,
  exercise_name TEXT,
  duration_seconds INTEGER DEFAULT 0,
  bpm INTEGER,
  score INTEGER,                   -- 0-100
  notes TEXT,
  recording_url TEXT,              -- URL do arquivo no Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de metas
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  phase TEXT DEFAULT 'fase1',      -- fase1, fase2, fase3, fase4
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conquistas
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,   -- ex: 'first_scale', 'week_streak', etc
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de gravações
CREATE TABLE recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  session_id UUID REFERENCES practice_sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scale_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuário só vê seus próprios dados
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users CRUD own scale_progress" ON scale_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD own sessions" ON practice_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD own recordings" ON recordings FOR ALL USING (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Storage bucket para gravações
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);

CREATE POLICY "Users can upload own recordings" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own recordings" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
