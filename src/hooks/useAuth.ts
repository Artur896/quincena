import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSession, onAuthStateChange } from "@/services/authService";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getSession()
      .then((current) => {
        if (mounted) setSession(current);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const unsubscribe = onAuthStateChange((next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { session, userId: session?.user.id ?? null, isLoading };
}
