import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { adminTitle } from "@/lib/store-brand";
import { getStoreBrand } from "@/lib/services/get-store-brand";
import { getValidSession } from "@/lib/auth0";
import { hasStoreAccess } from "@/lib/auth/config";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getStoreBrand();
  return {
    title: `Acesso negado · ${adminTitle(brand.siteName)}`,
    description: "Não tem permissão para aceder a esta página.",
  };
}

export default async function UnauthorizedPage() {
  const session = await getValidSession();
  const canGoDashboard = hasStoreAccess(session?.user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-border/80 bg-card p-8 shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
          <ShieldAlert className="h-6 w-6 text-amber-600" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-foreground">Acesso negado</h1>
          <p className="text-sm text-muted-foreground">
            Não tem permissão para aceder a esta página.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          {canGoDashboard ? (
            <Link
              href="/dashboard"
              className="flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              Ir para o dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              Voltar ao início
            </Link>
          )}
          <a
            href="/auth/logout"
            className="flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          >
            Terminar sessão
          </a>
        </div>
      </main>
    </div>
  );
}
