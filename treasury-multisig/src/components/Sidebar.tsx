"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { NETWORKS } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  ScrollText,
  Landmark,
  Wallet,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, route: "/" },
  { name: "Proposals", icon: ScrollText, route: "/proposals" },
  { name: "Governance", icon: ShieldCheck, route: "/governance" },
  { name: "Treasury", icon: Landmark, route: "/treasury" },
  { name: "Actions", icon: Zap, route: "/actions" },
  { name: "Settings", icon: Settings, route: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const networkName =
    chainId === NETWORKS.AMOY
      ? "Amoy Testnet"
      : chainId === NETWORKS.POLYGON
        ? "Polygon"
        : "Unknown";

  const networkColor =
    chainId === NETWORKS.AMOY
      ? "bg-emerald-500"
      : chainId === NETWORKS.POLYGON
        ? "bg-blue-500"
        : "bg-red-500";

  const isActive = (route: string) => {
    if (route === "/") return pathname === "/";
    return pathname.startsWith(route);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col md:border-r border-border bg-[hsl(var(--sidebar))] z-40">
        <div className="flex h-full flex-col justify-between px-3 py-4 scrollbar-thin overflow-y-auto">
          <div>
            {/* Logo */}
            <Link href="/">
              <div className="mb-8 flex items-center gap-3 rounded-lg px-3 py-2">
                <Wallet className="h-7 w-7 text-foreground" />
                <div>
                  <span className="text-base font-bold text-foreground">
                    Treasury
                  </span>
                  <span className="block text-[11px] font-medium text-muted-foreground">
                    Multisig Governance
                  </span>
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.route);
                return (
                  <Link
                    key={item.route}
                    href={item.route}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom section */}
          <div className="space-y-3">
            {/* Network + Theme row */}
            <div className="flex items-center gap-2">
              {isConnected && (
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <div className={`h-2 w-2 rounded-full ${networkColor}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {networkName}
                  </span>
                </div>
              )}
              <ThemeToggle />
            </div>

            {/* Connected address */}
            {isConnected && address && (
              <div className="rounded-lg border border-border bg-card px-3 py-2.5">
                <span className="text-[11px] text-muted-foreground">
                  Connected
                </span>
                <p className="text-xs font-mono font-medium text-foreground">
                  {formatAddress(address)}
                </p>
              </div>
            )}

            {/* Wallet connect */}
            <div className="[&>div]:w-full [&_button]:w-full [&_button]:justify-center">
              <ConnectButton
                showBalance={false}
                chainStatus="none"
                accountStatus="avatar"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid w-full grid-cols-5 mx-auto">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.route);
            return (
              <Link
                key={item.route}
                href={item.route}
                className={`flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
