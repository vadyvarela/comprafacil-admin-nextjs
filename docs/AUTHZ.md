# Permissões e cargos

Substitui `ROLES-AUTH0.md`, que descrevia o modelo anterior: cargos guardados
num claim do Auth0 e uma matriz de módulos no Next.js.

## Em duas frases

O **Auth0 autentica** — password, MFA, recuperação. A **API autoriza** — quem é
membro de que loja, com que cargo, e o que esse cargo pode fazer.

O backoffice não decide nada: pede `/api/me`, recebe a lista de permissões já
resolvida e desenha a partir dela.

## Porque mudou

O modelo anterior tinha o RBAC todo do lado do Next.js. A API só conhecia dois
níveis (`API` e `ADMIN`) e o backoffice inteiro falava com ela através de um
único token `ADMIN` partilhado.

A consequência era que os cinco cargos eram decorativos. Um `viewer` que
fizesse um pedido directo à API — ou que encontrasse uma rota do BFF sem guard,
e havia 86 dessas — tinha exactamente os mesmos poderes que o proprietário.

## Os cargos

| Cargo | O que faz |
|---|---|
| `viewer` | Vê dashboard, produtos e pedidos. **Não vê dados pessoais de clientes.** |
| `operator` | Trata dos pedidos e vê a ficha de quem os fez. Imprime facturas. |
| `manager` | Gere catálogo, marketing, vendas e definições. |
| `admin` | Tudo o que o gestor faz, mais equipa e tokens de API. |
| `owner` | Detém a loja. Único que a transfere ou apaga. Um por loja. |

Duas mudanças face ao modelo antigo:

- **`admin` e `owner` deixaram de ser a mesma coisa.** Tinham ambos rank 3 e
  poderes idênticos, o que fazia do cargo do meio um rótulo vazio.
- **`customers.pii.read` é uma permissão separada.** Ver um pedido e ver a
  pessoa que o fez são decisões diferentes. Antes o detalhe do pedido trazia a
  morada e o telefone do cliente para quem só tinha `orders.read`.

## O catálogo

Fonte da verdade: `kumprahub-api/src/authz/permissions.ts`. São 59 permissões em
três namespaces separados, para que um token de máquina nunca receba por engano
uma permissão de pessoa:

- `STORE_PERMISSIONS` — o que um membro da equipa faz dentro de uma loja
- `STOREFRONT_PERMISSIONS` — o que a loja pública faz em nome de um comprador
- `PLATFORM_PERMISSIONS` — o que o staff da plataforma faz acima das lojas

O backoffice tem um espelho em `lib/auth/permissions.ts`, **gerado**:

```bash
pnpm permissions:sync     # regenera
pnpm permissions:check    # falha se estiver desalinhado
```

Serve só para o TypeScript conhecer os nomes — um `can("prodcuts.write")` não
compila. As decisões continuam a ser da API.

## Como acrescentar uma permissão

1. Acrescenta-a a `STORE_PERMISSIONS` em `src/authz/permissions.ts`.
2. Dá-a aos cargos que a devem ter, em `src/authz/roles.ts`. O snapshot em
   `roles.spec.ts` vai falhar — actualiza-o, que é o ponto: mudar o poder de um
   cargo tem de ser deliberado.
3. Usa-a onde é exigida:
   - REST: `@RequirePermission('a.tua.permissao')` no handler.
   - GraphQL: entrada em `src/authz/operations.ts` para o campo raiz.
4. Corre `pnpm permissions:sync` no backoffice.
5. Se aparecer no menu, junta a entrada a `lib/nav.ts`.

Não é preciso lembrar-se de proteger: **uma rota sem decisão é negada**, e
`RouteCoverageService` faz o arranque falhar a dizer qual. O equivalente para
GraphQL é `operations.spec.ts`, que compara o mapa com o schema executável nos
dois sentidos.

## Onde é imposto

| Camada | O quê |
|---|---|
| `AuthenticationGuard` (API) | Valida o JWT por JWKS, resolve `sub` → utilizador → membership → permissões |
| `PermissionGuard` (API) | Nega por omissão, em REST e GraphQL |
| Extensão do Prisma (API) | Injecta `store_id` em todas as consultas — isolamento entre lojas |
| `assertCustomerScope` (API) | Um comprador só alcança os seus próprios dados |
| `requirePermission*` (backoffice) | Evita renderizar ecrãs que iam falhar, e esconder botões que não fazem nada |

A última linha é a mais importante de perceber: o backoffice é a **segunda**
linha. Esconder um botão nunca foi proteger uma acção.

## Equipa

`Definições → Equipa`. Convites por email com um token cujo hash é o que fica
guardado, ligados a um endereço concreto — quem apanhar o link não entra com
outra conta. Expiram em sete dias.

Regras que impedem a loja de ficar sem quem a administre:

- O proprietário não é removido nem despromovido por aqui.
- Ninguém muda o seu próprio cargo.
- Ninguém atribui um cargo acima do seu.
- `owner` não se atribui de todo — muda-se por transferência de loja.

## Variáveis de ambiente

Na API:

```
AUTH0_ISSUER_BASE_URL=https://tenant.eu.auth0.com/
AUTH0_API_AUDIENCE=<identificador da API no Auth0>
AUTH0_EMAIL_CLAIM=https://Kumprafacil.com/email
```

Sem `issuer` e `audience`, o verificador de JWT fica **desligado** e só o master
token autentica. Serve durante a transição; não depois dela.

No backoffice, `AUTH0_AUDIENCE` tem de ser o mesmo identificador, e
`API_BASE_URL` aponta para a API.

## O que ainda falta

- **A loja pública ainda não reencaminha o token do comprador.** Enquanto isso,
  `assertCustomerScope` não consegue verificar o id quando quem chama é o token
  de máquina da loja — regista um aviso e deixa passar. Fecha quando o
  `techarena` passar o token do cliente.
- **A Post-Login Action do Auth0 que injecta o claim de cargos** pode ser
  removida, mas só depois de a equipa estar importada para `memberships`
  (`pnpm authz:import-members --apply` na API).
