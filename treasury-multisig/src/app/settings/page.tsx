// src/app/settings/page.tsx
"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { useAppStore, type AppSection, type AccessEntry, type AddressBookEntry } from "@/store";
import { NETWORKS, CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy, Check, Wallet, Globe, FileCode, Key, Server,
  Coins, Shield, Plus, Trash2, Pencil, BookUser, X,
  ShieldCheck, BarChart3, Monitor, LayoutDashboard,
} from "lucide-react";

const ALL_SECTIONS: { id: AppSection; label: string; icon: React.ElementType }[] = [
  { id: "multisig", label: "Multisig", icon: Wallet },
  { id: "admin", label: "Admin", icon: ShieldCheck },
  { id: "funds", label: "Funds Flow", icon: BarChart3 },
  { id: "monitoring", label: "Monitoring", icon: Monitor },
];

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const [copied, setCopied] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  // Access rights state
  const accessList = useAppStore((s) => s.accessList);
  const accessEnforced = useAppStore((s) => s.accessEnforced);
  const setAccessEnforced = useAppStore((s) => s.setAccessEnforced);
  const addAccessEntry = useAppStore((s) => s.addAccessEntry);
  const updateAccessEntry = useAppStore((s) => s.updateAccessEntry);
  const removeAccessEntry = useAppStore((s) => s.removeAccessEntry);

  // Address book state
  const addressBook = useAppStore((s) => s.addressBook);
  const addAddressBookEntry = useAppStore((s) => s.addAddressBookEntry);
  const updateAddressBookEntry = useAppStore((s) => s.updateAddressBookEntry);
  const removeAddressBookEntry = useAppStore((s) => s.removeAddressBookEntry);

  // Local form states
  const [newAccessAddr, setNewAccessAddr] = useState("");
  const [newAccessLabel, setNewAccessLabel] = useState("");
  const [newAccessSections, setNewAccessSections] = useState<Set<AppSection>>(new Set(["multisig"]));
  const [editingAccess, setEditingAccess] = useState<string | null>(null);

  const [newBookAddr, setNewBookAddr] = useState("");
  const [newBookLabel, setNewBookLabel] = useState("");
  const [newBookNotes, setNewBookNotes] = useState("");
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [editBookLabel, setEditBookLabel] = useState("");
  const [editBookNotes, setEditBookNotes] = useState("");

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

  const isValidAddr = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleAddAccess = () => {
    if (!isValidAddr(newAccessAddr)) {
      addToast({ type: "error", title: "Invalid address", message: "Enter a valid 0x address" });
      return;
    }
    if (!newAccessLabel.trim()) {
      addToast({ type: "error", title: "Label required", message: "Give this wallet a name" });
      return;
    }
    addAccessEntry({
      address: newAccessAddr,
      label: newAccessLabel.trim(),
      sections: Array.from(newAccessSections),
    });
    // Also add to address book
    addAddressBookEntry({ address: newAccessAddr, label: newAccessLabel.trim() });
    addToast({ type: "success", title: "Access granted", message: `${newAccessLabel} added` });
    setNewAccessAddr("");
    setNewAccessLabel("");
    setNewAccessSections(new Set(["multisig"]));
  };

  const toggleAccessSection = (entry: AccessEntry, section: AppSection) => {
    const current = new Set(entry.sections);
    if (current.has(section)) {
      current.delete(section);
    } else {
      current.add(section);
    }
    updateAccessEntry(entry.address, { sections: Array.from(current) });
  };

  const handleAddBookEntry = () => {
    if (!isValidAddr(newBookAddr)) {
      addToast({ type: "error", title: "Invalid address", message: "Enter a valid 0x address" });
      return;
    }
    if (!newBookLabel.trim()) {
      addToast({ type: "error", title: "Label required" });
      return;
    }
    addAddressBookEntry({
      address: newBookAddr,
      label: newBookLabel.trim(),
      notes: newBookNotes.trim() || undefined,
    });
    addToast({ type: "success", title: "Contact added", message: newBookLabel });
    setNewBookAddr("");
    setNewBookLabel("");
    setNewBookNotes("");
  };

  const startEditBook = (entry: AddressBookEntry) => {
    setEditingBook(entry.address);
    setEditBookLabel(entry.label);
    setEditBookNotes(entry.notes ?? "");
  };

  const saveEditBook = (address: string) => {
    updateAddressBookEntry(address, {
      label: editBookLabel.trim(),
      notes: editBookNotes.trim() || undefined,
    });
    setEditingBook(null);
    addToast({ type: "success", title: "Contact updated" });
  };

  const baseInput =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors";

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your multisig wallet preferences
        </p>
      </div>

      {/* ═══════════════════════════════════════════
          ACCESS RIGHTS
          ═══════════════════════════════════════════ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Access Rights</CardTitle>
            <CardDescription>Control which wallets can access each app section</CardDescription>
          </div>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enforcement toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium">Enforce Access Control</p>
              <p className="text-xs text-muted-foreground">
                {accessEnforced
                  ? "Only listed wallets can access restricted sections"
                  : "All wallets have unrestricted access"}
              </p>
            </div>
            <button
              onClick={() => {
                setAccessEnforced(!accessEnforced);
                addToast({
                  type: "info",
                  title: `Access control ${!accessEnforced ? "enabled" : "disabled"}`,
                });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                accessEnforced ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  accessEnforced ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Add new entry form */}
          <div className="space-y-3 p-4 rounded-lg bg-accent/30 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Add Wallet Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="0x... wallet address"
                value={newAccessAddr}
                onChange={(e) => setNewAccessAddr(e.target.value)}
                className={baseInput}
              />
              <input
                type="text"
                placeholder="Label (e.g. CEO)"
                value={newAccessLabel}
                onChange={(e) => setNewAccessLabel(e.target.value)}
                className={baseInput}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SECTIONS.map((s) => {
                const Icon = s.icon;
                const selected = newAccessSections.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      const next = new Set(newAccessSections);
                      if (selected) next.delete(s.id);
                      else next.add(s.id);
                      setNewAccessSections(next);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                      selected
                        ? "bg-primary/10 text-primary ring-primary/30"
                        : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>
            <Button size="sm" onClick={handleAddAccess} disabled={!newAccessAddr || !newAccessLabel}>
              <Plus className="h-3 w-3 mr-1" /> Add Access
            </Button>
          </div>

          {/* Access list */}
          {accessList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No access entries yet. {!accessEnforced && "Enforcement is off — all wallets have full access."}
            </p>
          ) : (
            <div className="space-y-2">
              {accessList.map((entry) => (
                <div
                  key={entry.address}
                  className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {entry.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(entry.address, `access-${entry.address}`)}
                      >
                        {copied === `access-${entry.address}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          removeAccessEntry(entry.address);
                          addToast({ type: "warning", title: "Access revoked", message: entry.label });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {/* Section toggles */}
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SECTIONS.map((s) => {
                      const Icon = s.icon;
                      const enabled = entry.sections.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleAccessSection(entry, s.id)}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors ${
                            enabled
                              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                              : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════
          ADDRESS BOOK
          ═══════════════════════════════════════════ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Address Book</CardTitle>
            <CardDescription>Name wallets and contracts for easy identification</CardDescription>
          </div>
          <BookUser className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add entry form */}
          <div className="space-y-3 p-4 rounded-lg bg-accent/30 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Add Contact
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="0x... address"
                value={newBookAddr}
                onChange={(e) => setNewBookAddr(e.target.value)}
                className={baseInput}
              />
              <input
                type="text"
                placeholder="Label (e.g. Treasury, CEO)"
                value={newBookLabel}
                onChange={(e) => setNewBookLabel(e.target.value)}
                className={baseInput}
              />
            </div>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newBookNotes}
              onChange={(e) => setNewBookNotes(e.target.value)}
              className={baseInput}
            />
            <Button size="sm" onClick={handleAddBookEntry} disabled={!newBookAddr || !newBookLabel}>
              <Plus className="h-3 w-3 mr-1" /> Add Contact
            </Button>
          </div>

          {/* Entries list */}
          {addressBook.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contacts yet. Add wallet addresses above to label them across the app.
            </p>
          ) : (
            <div className="space-y-2">
              {addressBook.map((entry) => (
                <div
                  key={entry.address}
                  className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                >
                  {editingBook === entry.address ? (
                    /* Edit mode */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editBookLabel}
                        onChange={(e) => setEditBookLabel(e.target.value)}
                        className={baseInput}
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={editBookNotes}
                        onChange={(e) => setEditBookNotes(e.target.value)}
                        className={baseInput}
                        placeholder="Notes (optional)"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEditBook(entry.address)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingBook(null)}>
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{entry.label}</p>
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {entry.address}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(entry.address, `book-${entry.address}`)}
                        >
                          {copied === `book-${entry.address}` ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startEditBook(entry)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => {
                            removeAddressBookEntry(entry.address);
                            addToast({ type: "warning", title: "Contact removed", message: entry.label });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════
          EXISTING SETTINGS (unchanged below)
          ═══════════════════════════════════════════ */}

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
                <span className="font-mono text-sm">{formatAddress(address)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(address, "address")}>
                {copied === "address" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No wallet connected. Use the sidebar button.</p>
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
              .filter((c) => [NETWORKS.AMOY, NETWORKS.POLYGON, NETWORKS.ETHEREUM].includes(c.id))
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
          <p className="text-xs text-muted-foreground">Use Polygon Amoy Testnet to test multisig functionality.</p>
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
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{key}</p>
                  <p className="font-mono text-xs mt-0.5 truncate">{addr === "0x" ? "Not configured" : addr}</p>
                </div>
                {addr !== "0x" && (
                  <Button variant="ghost" size="sm" className="shrink-0 ml-2" onClick={() => handleCopy(addr, key)}>
                    {copied === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
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
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{key}</p>
                  <p className="font-mono text-xs mt-0.5 truncate">{addr}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 ml-2" onClick={() => handleCopy(addr, `token-${key}`)}>
                  {copied === `token-${key}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
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
            { id: "local", name: "Local Wallet", description: "Sign with connected wallet (MetaMask, etc.)" },
            { id: "fireblocks", name: "Fireblocks", description: "Enterprise-grade custody and signing" },
            { id: "kms", name: "AWS KMS", description: "Hardware Security Module integration" },
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
                <p className="text-xs text-muted-foreground">{method.description}</p>
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
                Mainnet: {process.env.NEXT_PUBLIC_RPC_MAINNET || "Not configured"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
