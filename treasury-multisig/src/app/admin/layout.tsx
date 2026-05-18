// src/app/admin/layout.tsx
import { AccessGate } from "@/components/AccessGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AccessGate section="admin">{children}</AccessGate>;
}
