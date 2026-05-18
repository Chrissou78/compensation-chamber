// src/components/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { NETWORKS } from "@/lib/constants";
import { useAppStore, type AppSection } from "@/store";
import { useAddressLabel } from "@/hooks/useAccessControl";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard, ScrollText, Landmark, Wallet, Settings, ShieldCheck,
  Zap, ChevronDown, Users, Coins, Ban, ArrowLeftRight, Fuel, Receipt,
  Activity, Heart, FileText, BarChart3, Monitor, Server, FileSearch, PenSquare,
} from "lucide-react";

interface NavSection {
  id: AppSection;
  label: string;
  icon: React.ElementType;
  items: { name: string; icon: React.ElementType; route: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "multisig",
    label: "Multisig",
    icon: Wallet,
    items: [
      { name: "Dashboard", icon: LayoutDashboard, route: "/" },
      { name: "Proposals", icon: ScrollText, route: "/proposals" },
      { name: "Governance", icon: ShieldCheck, route: "/governance" },
      { name: "Treasury", icon: Landmark, route: "/treasury" },
      { name: "Actions", icon: Zap, route: "/actions" },
      { name: "Settings", icon: Settings, route: "/settings" },
      { name: "Create Proposal", icon: PenSquare, route: "/proposals/create" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    items: [
      { name: "Overview", icon: LayoutDashboard, route: "/admin" },
      { name: "Validators", icon: Users, route: "/admin/validators" },
      { name: "Token Minting", icon: Coins, route: "/admin/tokens" },
      { name: "Blacklist", icon: Ban, route: "/admin/blacklist" },
    ],
  },
  {
    id: "funds",
    label: "Funds Flow",
    icon: BarChart3,
    items: [
      { name: "Overview", icon: LayoutDashboard, route: "/funds" },
      { name: "Wallets", icon: Wallet, route: "/funds/wallets" },
      { name: "Payouts", icon: Receipt, route: "/funds/payouts" },
      { name: "Rebalancing", icon: ArrowLeftRight, route: "/funds/rebalancing" },
      { name: "Gas Reserves", icon: Fuel, route: "/funds/gas" },
      { name: "Fees", icon: Coins, route: "/funds/fees" },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Monitor,
    items: [
      { name: "Dashboard", icon: Activity, route: "/monitoring" },
      { name: "Events", icon: FileText, route: "/monitoring/events" },
      { name: "Health", icon: Heart, route: "/monitoring/health" },
      { name: "Audit Trail", icon: FileSearch, route: "/monitoring/audit" },
    ],
  },
];

function getActiveSection(pathname: string): string {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/funds")) return "funds";
  if (pathname.startsWith("/monitoring")) return "monitoring";
  return "multisig";
}

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const hasAccess = useAppStore((s) => s.hasAccess);
  const addressLabel = useAddressLabel(address);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([getActiveSection(pathname)])
  );

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
    return pathname === route || pathname.startsWith(route + "/");
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeSection = getActiveSection(pathname);
  const mobileItems = NAV_SECTIONS.find((s) => s.id === activeSection)?.items.slice(0, 4) ?? [];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col md:border-r border-border bg-[hsl(var(--sidebar))] z-40">
        <div className="flex h-full flex-col justify-between px-3 py-4 scrollbar-thin overflow-y-auto">
          <div>
            {/* Logo */}
            <Link href="/">
              <div className="mb-6 flex items-center gap-3 rounded-lg px-3 py-2">
                <Wallet className="h-7 w-7 text-foreground" />
                <div>
                  <span className="text-base font-bold text-foreground">Compensation</span>
                  <span className="block text-[11px] font-medium text-muted-foreground">Chamber</span>
                </div>
              </div>
            </Link>

            {/* Section Navigation */}
            <nav className="space-y-1">
              {NAV_SECTIONS.map((section) => {
                const SectionIcon = section.icon;
                const isExpanded = expandedSections.has(section.id);
                const isSectionActive = activeSection === section.id;
                const canAccess = hasAccess(address, section.id);

                return (
                  <div key={section.id} className={!canAccess ? "opacity-40" : ""}>
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isSectionActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SectionIcon className="h-4 w-4" />
                        <span>{section.label}</span>
                        {!canAccess && (
                          <span className="text-[9px] uppercase tracking-wider text-red-400 font-bold">locked</span>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                      />
                    </button>

                    {/* Section items */}
                    {isExpanded && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.route);
                          return (
                            <Link
                              key={item.route}
                              href={item.route}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                                active
                                  ? "bg-accent text-foreground"
                                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isConnected && (
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <div className={`h-2 w-2 rounded-full ${networkColor}`} />
                  <span className="text-xs font-medium text-muted-foreground">{networkName}</span>
                </div>
              )}
              <ThemeToggle />
            </div>

            {isConnected && address && (
              <div className="rounded-lg border border-border bg-card px-3 py-2.5">
                <span className="text-[11px] text-muted-foreground">Connected</span>
                {addressLabel && (
                  <p className="text-xs font-medium text-foreground">{addressLabel}</p>
                )}
                <p className="text-xs font-mono font-medium text-foreground">
                  {formatAddress(address)}
                </p>
              </div>
            )}

            <div className="[&>div]:w-full [&_button]:w-full [&_button]:justify-center">
              <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid w-full grid-cols-5 mx-auto">
          {mobileItems.map((item) => {
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
          {/* Section switcher on mobile */}
          <div className="relative group">
            <button className="flex flex-col items-center justify-center py-2 text-[10px] font-medium text-muted-foreground w-full">
              <Server className="h-4 w-4 mb-0.5" />
              Apps
            </button>
            <div className="absolute bottom-full right-0 mb-2 hidden group-focus-within:block bg-card border border-border rounded-lg shadow-lg p-2 min-w-[140px]">
              {NAV_SECTIONS.map((section) => {
                const SIcon = section.icon;
                const canAccess = hasAccess(address, section.id);
                return (
                  <Link
                    key={section.id}
                    href={section.items[0].route}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? "bg-accent text-foreground"
                        : canAccess
                          ? "text-muted-foreground hover:bg-accent/50"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    <SIcon className="h-3.5 w-3.5" />
                    {section.label}
                    {!canAccess && <span className="text-[8px] text-red-400 ml-auto">locked</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
