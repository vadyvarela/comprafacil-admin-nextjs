import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { hasAdminRole } from "@/lib/auth/config";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const session = await auth0.getSession();
  const params = await searchParams;
  const authError = params.auth_error;

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
        <main className="flex w-full max-w-md flex-col items-center gap-8 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Kumpra Fácil Admin
          </h1>
          {authError && (
            <p className="w-full rounded-md bg-red-50 px-4 py-2 text-center text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              Erro de autenticação: {authError}. Tente novamente.
            </p>
          )}
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Acesso reservado a utilizadores autorizados. Faça login para continuar.
          </p>
          <a
            href="/api/auth/login?returnTo=/dashboard"
            className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
