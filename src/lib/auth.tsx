"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import supabase, { createClient } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// 관리자 권한 확인 함수 (클라이언트 컴포넌트용)
async function checkAdminPermissionClient(email: string) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('관리자 권한 확인 중 오류:', error);
      return false;
    }
    
    return !!data; // 데이터가 있으면 관리자임
  } catch (error) {
    console.error('관리자 권한 확인 중 예외 발생:', error);
    return false;
  }
}

// Auth 컨텍스트 타입 정의
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  isAdmin: boolean;
  checkIsAdmin: () => Promise<boolean>;
};

// Auth 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth 컨텍스트 제공자 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 여부 확인 함수
  const checkIsAdmin = async () => {
    if (!user?.email) return false;
    
    const isAdminUser = await checkAdminPermissionClient(user.email);
    setIsAdmin(isAdminUser);
    return isAdminUser;
  };

  useEffect(() => {
    // 현재 세션 가져오기
    const getSession = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('세션을 가져오는 중 오류가 발생했습니다:', error);
      }
      
      setSession(session);
      setUser(session?.user || null);
      
      // 사용자가 있으면 관리자 권한 확인
      if (session?.user?.email) {
        const isAdminUser = await checkAdminPermissionClient(session.user.email);
        setIsAdmin(isAdminUser);
      }
      
      setLoading(false);
    };

    getSession();

    // 세션 변경 감지 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        // 사용자가 있으면 관리자 권한 확인
        if (session?.user?.email) {
          const isAdminUser = await checkAdminPermissionClient(session.user.email);
          setIsAdmin(isAdminUser);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // 클린업 함수
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 로그인 함수
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  // 회원가입 함수
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    return { data, error };
  };

  // 로그아웃 함수
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // 비밀번호 재설정 함수
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    return { error };
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAdmin,
    checkIsAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Auth 컨텍스트 사용을 위한 훅
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다');
  }
  
  return context;
}
