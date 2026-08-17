import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/auth0";
import { getPrimaryRole, getStoreRolesFromUser, hasStoreAccess } from "@/lib/auth/config";
import { AppSidebar } from "@/components/app-sidebar";
import { getStoreBrand } from "@/lib/services/get-store-brand";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getValidSession();

  if (!session?.user) {
    redirect("/auth/login?returnTo=/dashboard");
  }

  if (!hasStoreAccess(session.user)) {
    redirect("/unauthorized");
  }

  const storeBrand = await getStoreBrand();
  const primaryRole = getPrimaryRole(session.user);
  const roles = getStoreRolesFromUser(session.user);

  return (
    <SidebarProvider>
      <AppSidebar
        storeBrand={storeBrand}
        primaryRole={primaryRole}
        roles={roles}
        user={{
          name: session.user.name,
          email: session.user.email,
          picture: session.user.picture ?? undefined,
        }}
      />
      <SidebarInset className="min-h-0 min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}
