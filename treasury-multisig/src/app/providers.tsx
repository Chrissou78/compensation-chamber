"use client";

import { ReactNode, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { config } from "@/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

function RainbowKitWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Don't render RainbowKit until theme is resolved on client
  // This prevents the hydration mismatch on the data-rk style tag
  if (!mounted) {
    return <>{children}</>;
  }

  const rkTheme =
    resolvedTheme === "dark"
      ? darkTheme({
          accentColor: "hsl(216, 34%, 17%)",
          accentColorForeground: "hsl(210, 40%, 98%)",
          borderRadius: "medium",
          fontStack: "system",
        })
      : lightTheme({
          accentColor: "hsl(222.2, 47.4%, 11.2%)",
          accentColorForeground: "hsl(210, 40%, 98%)",
          borderRadius: "medium",
          fontStack: "system",
        });

  return <RainbowKitProvider theme={rkTheme}>{children}</RainbowKitProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWithTheme>{children}</RainbowKitWithTheme>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
