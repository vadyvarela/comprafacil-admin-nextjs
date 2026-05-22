# Envios — backoffice (techstore-backoffice)

Configuração das **faixas de envio** e **pontos de levantamento** consumidas pelo payment-gateway e pela loja (techarena).

Especificação técnica completa: `payment-gateway/docs/CHECKOUT-SHIPPING.md`.

---

## Onde configurar

**Dashboard → Definições → Envios** (`app/dashboard/settings/shipping/page.tsx`)

---

## Conceitos

| Campo | Unidade | Notas |
|-------|---------|--------|
| Ilha | UUID (`state` em locations) | Uma faixa por ilha + modo de entrega |
| `minSubtotal` / `maxSubtotal` | **Escudos (major)** | `max` inclusivo na cotação |
| `shippingPrice` | **Escudos (major)** | `0` = envio grátis na faixa |
| Modo | `HOME` ou `PICKUP` | Na loja, PICKUP só se `NEXT_PUBLIC_ENABLE_PICKUP_CHECKOUT=true` |

---

## Boas práticas

1. Cobrir **todas as ilhas** onde vendes, para `HOME` (entrega ao domicílio).
2. Faixas sem buracos: ex. 0–50 CVE, 50.01–200 CVE, 200+ CVE (sem `max` na última).
3. Após alterar faixas, clientes com checkout aberto podem ver “preço desactualizado” — devem actualizar o checkout (comportamento esperado).
4. Garantir que existem **states** Cabo Verde no GTW (`LocationDataSeeder`) antes de criar faixas.

---

## GraphQL (via backoffice)

Mutations/queries em `lib/graphql/shipping/` — proxy para o mesmo schema do GTW:

- `shippingTiers`, `upsertShippingTier`, `deleteShippingTier`
- `pickupPoints`, `upsertPickupPoint`, `deletePickupPoint`

---

## Erro na loja: “Envio não configurado…”

Significa: para a **ilha** da morada, modo **HOME** (ou PICKUP) e **subtotal do carrinho** (em escudos), não há nenhuma faixa activa.

**Solução:** criar ou ajustar faixa em Envios para essa ilha e intervalo de subtotal.

---

## Deploy

Backoffice só precisa de:

- URL GraphQL do GTW
- Token API com permissões de administração (mesmo ecossistema que a loja)

Alterações de faixas são imediatas no GTW; não é necessário redeploy da loja só por mudar preços de envio.
