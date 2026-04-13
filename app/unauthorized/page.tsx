import Link from "next/link";

export const metadata = {
  title: "Acesso negado - Kumpra Fácil Admin",
  description: "Não tem permissão para aceder ao backoffice.",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            className="h-6 w-6 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Acesso negado
        </h1>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Não tem permissões para aceder ao backoffice. Apenas utilizadores com
          role de administrador podem entrar.
        </p>
        <div className="flex w-full flex-col gap-3">
          <a
            href="/auth/logout"
            className="flex h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Terminar sessão
          </a>
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
