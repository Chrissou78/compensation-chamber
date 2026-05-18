// src/app/funds/layout.tsx
import { AccessGate } from "@/components/AccessGate";

export default function FundsLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate section="funds">{children}</AccessGate>;
}
