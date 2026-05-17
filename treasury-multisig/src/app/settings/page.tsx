"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { useAppStore } from "@/store";
import { NETWORKS, CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import { Coins } from "lucide-react";  // add Coins to the existing lucide import
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Wallet,
  Globe,
  FileCode,
  Key,
  Server,
} from "lucide-react";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const [copied, setCopied] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    addToast({
      type: "success",
      title: "Copied to clipboard",
      description: text.length > 20 ? `${text.slice(0, 10)}...${text.slice(-8)}` : text,
      duration: 2000,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your multisig wallet preferences
        </p>
      </div>

      {/* Wallet */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>Connected account</CardDescription>
          </div>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isConnected && address ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-sm">
                  {formatAddress(address)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(address, "address")}
              >
                {copied === "address" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No wallet connected. Use the sidebar button.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Network */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Network</CardTitle>
            <CardDescription>Chain ID: {chainId}</CardDescription>
          </div>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {chains
              .filter((c) =>
                [NETWORKS.AMOY, NETWORKS.POLYGON, NETWORKS.ETHEREUM].includes(
                  c.id
                )
              )
              .map((chain) => (
                <Button
                  key={chain.id}
                  variant={chainId === chain.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchChain({ chainId: chain.id })}
                >
                  {chain.name}
                </Button>
              ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Use Polygon Amoy Testnet to test multisig functionality.
          </p>
        </CardContent>
      </Card>

      {/* Contract Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Contract Addresses</CardTitle>
            <CardDescription>Deployed contract registry</CardDescription>
          </div>
          <FileCode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(CONTRACT_ADDRESSES).map(([key, addr]) => (
            <div key={key} className="p-3 rounded-lg bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {key}
                  </p>
                  <p className="font-mono text-xs mt-0.5 truncate">
                    {addr === "0x" ? "Not configured" : addr}
                  </p>
                </div>
                {addr !== "0x" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 ml-2"
                    onClick={() => handleCopy(addr, key)}
                  >
                    {copied === key ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Token Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Test Token Addresses</CardTitle>
            <CardDescription>Deployed stablecoins on Amoy</CardDescription>
          </div>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(TOKEN_ADDRESSES).map(([key, addr]) => (
            <div key={key} className="p-3 rounded-lg bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {key}
                  </p>
                  <p className="font-mono text-xs mt-0.5 truncate">{addr}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 ml-2"
                  onClick={() => handleCopy(addr, `token-${key}`)}
                >
                  {copied === `token-${key}` ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Signature Method */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Signature Method</CardTitle>
            <CardDescription>How transactions are signed</CardDescription>
          </div>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {
              id: "local",
              name: "Local Wallet",
              description: "Sign with connected wallet (MetaMask, etc.)",
            },
            {
              id: "fireblocks",
              name: "Fireblocks",
              description: "Enterprise-grade custody and signing",
            },
            {
              id: "kms",
              name: "AWS KMS",
              description: "Hardware Security Module integration",
            },
          ].map((method) => (
            <label
              key={method.id}
              className="flex items-center p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="signature-method"
                value={method.id}
                defaultChecked={method.id === "local"}
                className="h-4 w-4 shrink-0"
                suppressHydrationWarning
              />
              <div className="ml-3">
                <p className="text-sm font-medium">{method.name}</p>
                <p className="text-xs text-muted-foreground">
                  {method.description}
                </p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>External service configuration</CardDescription>
          </div>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Subgraph URL</p>
            <p className="font-mono text-xs p-2 rounded bg-accent/50 break-all">
              {process.env.NEXT_PUBLIC_SUBGRAPH_URL || "Not configured"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">RPC Endpoints</p>
            <div className="space-y-1">
              <p className="font-mono text-xs p-2 rounded bg-accent/50 break-all">
                Amoy: {process.env.NEXT_PUBLIC_RPC_AMOY || "Not configured"}
              </p>
              <p className="font-mono text-xs p-2 rounded bg-accent/50 break-all">
                Mainnet:{" "}
                {process.env.NEXT_PUBLIC_RPC_MAINNET || "Not configured"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
