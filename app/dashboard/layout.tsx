import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
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
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/api/auth/login?returnTo=/dashboard");
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
