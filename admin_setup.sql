-- 관리자 설정을 위한 SQL 스크립트
-- Supabase SQL 에디터에서 실행해주세요.

-- 1. 관리자 테이블에 추가 필드 설정 (이미 생성되어 있다면 ALTER TABLE로 추가)
ALTER TABLE IF EXISTS public.admins 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"packages": true, "reservations": true, "notices": true, "users": false, "settings": false}'::jsonb;

-- 2. 관리자 추가하기 (기본 관리자)
INSERT INTO admins (email, name, role, permissions) 
VALUES (
  'admin@tripstore.com', 
  '시스템 관리자', 
  'superadmin',
  '{"packages": true, "reservations": true, "notices": true, "users": true, "settings": true}'::jsonb
)
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = true;

-- 3. 테스트용 추가 관리자
INSERT INTO admins (email, name, role, permissions) 
VALUES (
  'manager@tripstore.com', 
  '운영 관리자', 
  'manager',
  '{"packages": true, "reservations": true, "notices": true, "users": false, "settings": false}'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = true;

-- 4. 관리자 알림 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.admins(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 관리자 접근 로그 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS public.admin_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.admins(id),
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RLS 정책 설정
ALTER TABLE IF EXISTS public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_access_logs ENABLE ROW LEVEL SECURITY;

-- 관리자 자신의 알림만 볼 수 있도록 RLS 정책 추가
CREATE POLICY IF NOT EXISTS "관리자 알림 정책" ON public.admin_notifications
  FOR ALL USING (admin_id = auth.uid());

-- 슈퍼 관리자는 모든 로그 볼 수 있도록 RLS 정책 추가
CREATE POLICY IF NOT EXISTS "슈퍼 관리자 로그 접근 정책" ON public.admin_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- 7. 관리자 목록 확인하기
SELECT * FROM admins;
