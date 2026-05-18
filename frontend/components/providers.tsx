"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { useUIStore } from "@/frontend/store";

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
    // Remove all previous theme classes
    document.body.classList.remove("theme-ocean", "theme-emerald", "theme-sunset", "theme-purple");
    // Add current theme class if not default purple
    if (colorTheme !== "purple") {
      document.body.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

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
        <SocketProvider>
          <ColorThemeWrapper>
            {children}
          </ColorThemeWrapper>
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
