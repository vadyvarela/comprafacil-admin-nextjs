import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/auth0";
import { hasAdminRole } from "@/lib/auth/config";
import { Zap } from "lucide-react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const session = await getValidSession();
  const params = await searchParams;
  const authError = params.auth_error;

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <main className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 shadow-lg mx-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-600 shadow-md shadow-indigo-900/40">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-foreground">KumpraFacil Admin</h1>
            <p className="text-sm text-muted-foreground">
              Acesso reservado a utilizadores autorizados
            </p>
          </div>
          {authError && (
            <div className="w-full rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-center text-xs text-destructive font-medium">
              Erro de autenticação: {authError}. Tente novamente.
            </div>
          )}
          <a
            href="/auth/login?returnTo=/dashboard"
            className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar
          </a>
        </main>
      </div>
    );
  }

  if (!hasAdminRole(session.user)) {
    redirect("/unauthorized");
  }

  redirect("/dashboard");
}
