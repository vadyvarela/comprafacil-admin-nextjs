import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/auth0";
import { hasAdminRole } from "@/lib/auth/config";
import { AppSidebar } from "@/components/app-sidebar";
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

  if (!hasAdminRole(session.user)) {
    redirect("/unauthorized");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          picture: session.user.picture ?? undefined,
        }}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
