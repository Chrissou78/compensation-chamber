// src/app/monitoring/layout.tsx
import { AccessGate } from "@/components/AccessGate";

export default function MonitoringLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate section="monitoring">{children}</AccessGate>;
}
