import { ReactNode } from "react";
import { DashboardNav } from "./Nav";
import { PractitionerOnly } from "./RoleGate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PractitionerOnly>
      <div className="paper-grain min-h-screen flex flex-col">
        <DashboardNav />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </PractitionerOnly>
  );
}
