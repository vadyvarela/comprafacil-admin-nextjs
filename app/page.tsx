import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/auth0";
import { hasStoreAccess } from "@/lib/auth/config";
import { StoreBrandLogo } from "@/components/store-brand-mark";
import { adminTitle } from "@/lib/store-brand";
import { getStoreBrand } from "@/lib/services/get-store-brand";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const session = await getValidSession();
  const params = await searchParams;
  const authError = params.auth_error;
  const storeBrand = await getStoreBrand();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <main className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-border/80 bg-card p-8 shadow-xs">
          <StoreBrandLogo brand={storeBrand} size="md" />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-foreground">{adminTitle(storeBrand.siteName)}</h1>
            <p className="text-sm text-muted-foreground">
              Acesso reservado a utilizadores autorizados
            </p>
          </div>
          {authError && (
            <div className="w-full rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-center text-xs font-medium text-destructive">
              Erro de autenticação: {authError}. Tente novamente.
            </div>
          )}
          <a
            href="/auth/login?returnTo=/dashboard"
            className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
          >
            Entrar
          </a>
        </main>
      </div>
    );
  }

  if (!hasStoreAccess(session.user)) {
    redirect("/unauthorized");
  }

  redirect("/dashboard");
}
