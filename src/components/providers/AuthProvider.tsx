"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // Use getSession() for instant local check (no network request)
    // Then onAuthStateChange handles validation + updates
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        // Fetch role in background
        supabase
          .from("creators")
          .select("role")
          .eq("auth_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (mounted) setRole(data?.role || "creator");
          });
      }
      setLoading(false);
    });

    // Failsafe: never stay loading longer than 3 seconds
    const timeout = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 3000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        const { data: creator } = await supabase
          .from("creators")
          .select("role")
          .eq("auth_id", newUser.id)
          .single();
        if (mounted) setRole(creator?.role || "creator");
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
