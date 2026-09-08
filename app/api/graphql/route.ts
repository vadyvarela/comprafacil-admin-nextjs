import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/auth0";
import { rateLimit } from "@/lib/security/rate-limit";
import { requestIp } from "@/lib/security/request-ip";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Porta do browser para a API.
 *
 * Era aqui que vivia o `ROOT_FIELD_ACCESS`: cerca de setenta campos GraphQL
 * mapeados à mão para módulo e modo, mais o código que fazia parse do documento
 * e resolvia fragments para descobrir que campos raiz eram pedidos.
 *
 * Saiu tudo. A API passou a autorizar cada operação contra o seu próprio
 * catálogo, validado no arranque contra o schema executável, e manter uma
 * segunda cópia aqui seria recriar exactamente a duplicação que este trabalho
 * veio eliminar — com o agravante de ser a cópia que envelhece sem ninguém dar
 * por isso.
 *
 * O que fica: sessão válida, o token da pessoa reencaminhado, e o limite por
 * IP.
 */

const GTW_URL = process.env.GTW_URL;
const GTW_TOKEN = process.env.GTW_TOKEN;

/** Import de catálogo gera 1+N mutações por produto; 30/min rebentava o fluxo. */
const ADMIN_GRAPHQL_BURST = { maxRequests: 800, windowMs: 60_000 };

type GraphQLProxyResponse = { errors?: { message?: string }[] };

export async function POST(request: NextRequest) {
  const session = await getValidSession();
  if (!session?.tokenSet?.accessToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Depois da sessão, de propósito: limitar antes disso dava a quem não está
  // autenticado uma forma barata de consumir a quota de quem está.
  const limited = rateLimit(requestIp(request), ADMIN_GRAPHQL_BURST);
  if (limited) {
    return limited;
  }

  if (!GTW_URL || !GTW_TOKEN) {
    return NextResponse.json(
      { error: "Gateway configuration missing (GTW_URL, GTW_TOKEN)" },
      { status: 500 },
    );
  }

  try {
    const body: unknown = await request.json();
    const send = () =>
      fetch(`${GTW_URL}/${GTW_TOKEN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // A identidade de quem está sentado ao teclado, não um token
          // partilhado. É isto que faz a API poder decidir por pessoa.
          Authorization: `Bearer ${session.tokenSet.accessToken}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });

    const response = await send();
    const data = (await response.json()) as GraphQLProxyResponse;

    if (data.errors?.length) {
      console.error(
        "GraphQL errors:",
        data.errors
          .map((error) => error.message)
          .filter(Boolean)
          .join("; "),
      );

      // Erro de ligação à base de dados costuma passar à segunda.
      const transitorio = data.errors.some(
        (error) =>
          error.message?.includes("JDBC Connection") ||
          error.message?.includes("Unable to commit"),
      );
      if (transitorio) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const retry = await send();
          const retryData = (await retry.json()) as GraphQLProxyResponse;
          if (
            !retryData.errors?.some((error) =>
              error.message?.includes("JDBC Connection"),
            )
          ) {
            return NextResponse.json(retryData);
          }
          console.error("A repetição falhou com o mesmo erro de ligação.");
        } catch (retryError) {
          console.error("A repetição falhou:", getErrorMessage(retryError));
        }
      }
    }

    return NextResponse.json(data, {
      status: data.errors ? 200 : response.status,
    });
  } catch (error: unknown) {
    console.error("GraphQL API error:", getErrorMessage(error));
    return NextResponse.json(
      { error: "Erro ao contactar o gateway." },
      { status: 502 },
    );
  }
}
