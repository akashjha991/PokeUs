"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";
import { useAuth } from "@/frontend/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function ColorThemeWrapper({ children }: { children: React.ReactNode }) {
  const colorTheme = useUIStore((state) => state.colorTheme);

  useEffect(() => {
    document.body.classList.remove(
      "theme-ocean",
      "theme-emerald",
      "theme-sunset",
      "theme-purple"
    );
    if (colorTheme !== "purple") {
      document.body.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

  return <>{children}</>;
}

/**
 * AuthInitializer — mounts inside providers to initialize Supabase auth
 * state and set up the cross-tab session listener.
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

import { SocketProvider } from "@/frontend/providers/SocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthInitializer>
          <SocketProvider>
            <ColorThemeWrapper>{children}</ColorThemeWrapper>
          </SocketProvider>
        </AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
