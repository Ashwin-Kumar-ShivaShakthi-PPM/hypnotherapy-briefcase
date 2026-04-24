import { ReactNode } from "react";
import { ClientOnly } from "../dashboard/RoleGate";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <ClientOnly>{children}</ClientOnly>;
}
