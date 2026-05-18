// src/app/actions/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ACTIONS_CONFIG, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/constants";
import { ActionType } from "@/types";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search, Filter, Shield, Vote, AlertTriangle, Landmark, Eye,
  ChevronRight,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  governance: Shield,
  voting: Vote,
  emergency: AlertTriangle,
  treasury: Landmark,
  view: Eye,
};

export default function ActionsPage() {
  const { isConnected } = useAccount();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(ACTIONS_CONFIG).forEach((a) => cats.add(a.category));
    return Array.from(cats);
  }, []);

  const filteredActions = useMemo(() => {
    return Object.values(ACTIONS_CONFIG).filter((a) => {
      if (activeCategory && a.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, activeCategory]);

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to view actions</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contract Actions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Execute governance proposals, treasury operations, and administrative tasks
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
              !activeCategory
                ? "bg-primary/10 text-primary ring-primary/30"
                : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] ?? Filter;
            const selected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(selected ? null : cat)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                  selected
                    ? "bg-primary/10 text-primary ring-primary/30"
                    : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
                }`}
              >
                <Icon className="h-3 w-3" />
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action cards grid */}
      {filteredActions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No actions match your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map((action) => {
            const colorClass = CATEGORY_COLORS[action.category] ?? "text-muted-foreground";
            return (
              <Card key={action.id} className="hover:bg-accent/30 transition-colors group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium uppercase tracking-wider ${colorClass}`}>
                      {CATEGORY_LABELS[action.category] ?? action.category}
                    </span>
                    {action.requiresVoting && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 rounded px-1.5 py-0.5 ring-1 ring-inset ring-amber-500/20">
                        Requires Vote
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-sm mt-2">{action.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                    <Link href={`/actions/${action.id}`}>
                      Execute
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
