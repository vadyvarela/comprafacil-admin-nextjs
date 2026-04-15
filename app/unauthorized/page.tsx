import Link from "next/link";
import { ShieldAlert, Zap } from "lucide-react";

export const metadata = {
  title: "Acesso negado - KumpraFacil Admin",
  description: "Não tem permissão para aceder ao backoffice.",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 shadow-lg mx-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
          <ShieldAlert className="h-6 w-6 text-amber-400" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-foreground">Acesso negado</h1>
          <p className="text-sm text-muted-foreground">
            Não tem permissões para aceder ao backoffice. Apenas utilizadores com
            role de administrador podem entrar.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <a
            href="/auth/logout"
            className="flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Terminar sessão
          </a>
          <Link
            href="/"
            className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
