CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  country_code TEXT DEFAULT 'NG',
  password_hash TEXT,
  profile_image TEXT,
  avatar TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  signup_method TEXT NOT NULL DEFAULT 'email',
  onboarding_step TEXT NOT NULL DEFAULT 'verify',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ
);

CREATE TABLE admin_users (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE books (
  book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT NOT NULL,
  cover_image TEXT,
  blurb TEXT,
  book_order INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft',
  free_preview_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sections (
  section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  order_number INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft',
  tts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tts_voice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chapters (
  chapter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(section_id) ON DELETE CASCADE,
  chapter_title TEXT NOT NULL,
  chapter_subtitle TEXT,
  chapter_number INTEGER,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_number INTEGER NOT NULL,
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchases (
  purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  book_id UUID REFERENCES books(book_id) ON DELETE SET NULL,
  section_id UUID REFERENCES sections(section_id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_reference TEXT NOT NULL UNIQUE,
  payment_gateway TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reading_progress (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(section_id) ON DELETE SET NULL,
  chapter_id UUID NOT NULL REFERENCES chapters(chapter_id) ON DELETE CASCADE,
  scroll_position INTEGER NOT NULL DEFAULT 0,
  percentage_completed NUMERIC(5, 2) NOT NULL DEFAULT 0,
  device_type TEXT,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);

CREATE TABLE gifts (
  gift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  gift_package TEXT NOT NULL,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'Generated',
  redeemed_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE community_posts (
  post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(book_id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Visible',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE post_likes (
  post_id UUID NOT NULL REFERENCES community_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_books_order ON books(book_order);
CREATE INDEX idx_sections_book_order ON sections(book_id, order_number);
CREATE INDEX idx_chapters_book_order ON chapters(book_id, order_number);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_progress_user ON reading_progress(user_id);
CREATE INDEX idx_gifts_sender ON gifts(sender_user_id);
CREATE INDEX idx_gifts_recipient ON gifts(recipient_email);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);
