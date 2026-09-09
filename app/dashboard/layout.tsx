import { AppSidebar } from "@/components/app-sidebar";
import { PermissionsProvider } from "@/components/providers/permissions-provider";
import { getStoreBrand } from "@/lib/services/get-store-brand";
import { activeStore } from "@/lib/auth/principal";
import { requireSessionPage } from "@/lib/auth/requirePermission";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Uma chamada por render, desduplicada por `cache()`: o layout, as páginas e
  // os guards abaixo partilham este mesmo resultado.
  const principal = await requireSessionPage();
  const storeBrand = await getStoreBrand();
  const store = activeStore(principal);

  return (
    <PermissionsProvider permissions={principal.permissions}>
      <SidebarProvider>
        <AppSidebar
          storeBrand={storeBrand}
          primaryRole={store?.role ?? null}
          user={{
            name: principal.user?.name ?? null,
            email: principal.user?.email ?? null,
            picture: principal.user?.picture ?? undefined,
          }}
        />
        <SidebarInset className="min-h-0 min-w-0">{children}</SidebarInset>
      </SidebarProvider>
    </PermissionsProvider>
  );
}
