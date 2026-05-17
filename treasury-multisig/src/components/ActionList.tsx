"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionType } from "@/types";
import { ACTIONS_CONFIG, CATEGORY_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function ActionList() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(Object.values(ACTIONS_CONFIG).map((a) => a.category))
  );

  const filteredActions = selectedCategory
    ? Object.values(ACTIONS_CONFIG).filter((a) => a.category === selectedCategory)
    : Object.values(ACTIONS_CONFIG);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select an action to execute or propose
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Actions
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {CATEGORY_LABELS[cat] || cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActions.map((action) => (
          <Link key={action.id} href={`/actions/${action.id}`} className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex-1">
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {action.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-accent text-accent-foreground capitalize">
                      {action.category}
                    </span>
                    {action.requiresApproval && (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400">
                        Approval
                      </span>
                    )}
                    {action.requiresVoting && (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/10 text-purple-400">
                        Vote
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            No actions found in this category
          </p>
        </div>
      )}
    </div>
  );
}
