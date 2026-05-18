// src/components/AccessGate.tsx
"use client";

import Link from "next/link";
import { useHasAccess } from "@/hooks/useAccessControl";
import { type AppSection } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, Lock } from "lucide-react";

interface AccessGateProps {
  section: AppSection;
  children: React.ReactNode;
}

/**
 * Wrap any page content with <AccessGate section="admin"> to enforce
 * wallet-level access rights. When enforcement is off, children render
 * unconditionally.
 */
export function AccessGate({ section, children }: AccessGateProps) {
  const { hasAccess, isEnforced, isConnected } = useHasAccess(section);

  // When enforcement is off, pass through
  if (!isEnforced) return <>{children}</>;

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold mb-2">Wallet Required</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Connect your wallet to access this section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected but no access
  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <ShieldX className="h-10 w-10 mx-auto text-red-400 mb-4" />
            <h2 className="text-lg font-bold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your wallet does not have permission to access the{" "}
              <span className="font-medium capitalize">{section}</span> section.
              Contact an administrator to request access.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
