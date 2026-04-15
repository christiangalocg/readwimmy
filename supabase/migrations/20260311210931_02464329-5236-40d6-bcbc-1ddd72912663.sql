-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('epub', 'pdf', 'kindle', 'other')),
  total_chapters INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reading progress table
CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  current_chapter INTEGER DEFAULT 1,
  current_page INTEGER DEFAULT 1,
  percentage NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'reading' CHECK (status IN ('not_started', 'reading', 'finished')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.reading_progress FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI analyses table
CREATE TABLE public.ai_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('summary', 'characters', 'themes', 'vocabulary', 'essay_prompts', 'chapter_analysis')),
  chapter_number INTEGER,
  content JSONB NOT NULL DEFAULT '{}',
  spoiler_safe_until INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses" ON public.ai_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analyses" ON public.ai_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analyses" ON public.ai_analyses FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_analyses_book ON public.ai_analyses(book_id, analysis_type);

-- Storage bucket for book uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('books', 'books', false);

CREATE POLICY "Users can view their own book files" ON storage.objects FOR SELECT USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own book files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own book files" ON storage.objects FOR DELETE USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);