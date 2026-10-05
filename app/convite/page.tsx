import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { getValidSession } from "@/lib/auth0";
import { StoreBrandLogo } from "@/components/store-brand-mark";
import { adminTitle } from "@/lib/store-brand";
import { getStoreBrand } from "@/lib/services/get-store-brand";
import { acceptInvitation } from "./actions";

/**
 * Destino do link que a API gera ao convidar (`/convite?token=…`).
 *
 * Quem chega aqui ainda não é membro de loja nenhuma, por isso esta página não
 * pode passar pelos guards de permissão: só exige sessão, e só no momento de
 * aceitar. A API valida o resto — token, validade e que o email da conta é o
 * do convite.
 */

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getStoreBrand();
  return { title: `Convite · ${adminTitle(brand.siteName)}` };
}

const ERROS: Record<string, string> = {
  invalido:
    "Convite inválido ou expirado, ou a conta com que entrou não é a do email convidado.",
  sessao: "A sessão expirou. Entre de novo para aceitar o convite.",
  conta:
    "Este email já entrou antes por outro método (Google ou email e password). Termine a sessão e entre da mesma forma que da primeira vez.",
  falha: "Não foi possível aceitar o convite agora. Tente de novo dentro de momentos.",
};

const primario =
  "flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35";
const secundario =
  "flex h-10 w-full items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35";

export default async function ConvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; erro?: string }>;
}) {
  const { token, erro } = await searchParams;
  const [session, storeBrand] = await Promise.all([
    getValidSession(),
    getStoreBrand(),
  ]);
  const mensagemErro = erro ? (ERROS[erro] ?? ERROS.invalido) : null;
  const returnTo = token
    ? `/convite?token=${encodeURIComponent(token)}`
    : "/convite";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="mx-4 flex w-full max-w-md flex-col items-center gap-6 rounded-lg border border-border/80 bg-card p-8 shadow-xs">
        <StoreBrandLogo brand={storeBrand} size="md" />
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold text-foreground">
            Convite para a equipa
          </h1>
          <p className="text-sm text-muted-foreground">
            {token
              ? `Foi convidado para o ${adminTitle(storeBrand.siteName)}.`
              : "Este link não tem convite. Peça um novo a quem o convidou."}
          </p>
        </div>

        {mensagemErro && (
          <div className="w-full rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-center text-xs font-medium text-destructive">
            {mensagemErro}
          </div>
        )}

        {token && (
          <div className="flex w-full flex-col gap-2.5">
            {session?.user && erro !== "sessao" ? (
              <>
                <p className="text-center text-xs text-muted-foreground">
                  Sessão iniciada como{" "}
                  <span className="font-medium text-foreground">
                    {session.user.email}
                  </span>
                </p>
                <form action={acceptInvitation}>
                  <input type="hidden" name="token" value={token} />
                  <button type="submit" className={primario}>
                    Aceitar convite
                  </button>
                </form>
                <a href="/auth/logout" className={secundario}>
                  Não é esta a conta? Terminar sessão
                </a>
              </>
            ) : (
              <a
                href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
                className={primario}
              >
                Entrar para aceitar
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
