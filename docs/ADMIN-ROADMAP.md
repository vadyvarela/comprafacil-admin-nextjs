# Roadmap do Admin

Estado das funcionalidades do backoffice, comparado com um admin de loja online completo (referência: Shopify). Revisto a 2026-10-06 contra o código; o que não foi possível confirmar fica com **?**.

Legenda: ✅ existe · Parcial · ❌ não existe · ? por confirmar

---

## 1. Catálogo

| Funcionalidade | Estado | Notas |
|---|---|---|
| Listar produtos (filtros por categoria, marca, estado) | ✅ | |
| Criar produto | ✅ | Modal (`?create=1`) |
| Editar produto | ✅ | Página `/dashboard/products/[id]/edit` |
| Imagens e galeria | ✅ | Produto e variante |
| Variantes | ✅ | `VariantManager` |
| Stock | ✅ | `StockModal` no detalhe |
| SKU, desconto | ✅ | |
| Publicar / ocultar | ✅ | |
| SEO (meta title, description) | ❌ | Só os campos do catálogo Meta |
| Importar catálogo | Parcial | JSON (`/dashboard/products/importar`); sem exportar |

## 2. Categorias e marcas

| Funcionalidade | Estado | Notas |
|---|---|---|
| Categorias em árvore | ✅ | |
| Marcas | ✅ | |
| Coleções / tags | ? | |

## 3. Pedidos

| Funcionalidade | Estado | Notas |
|---|---|---|
| Listar e ver detalhe | ✅ | |
| Filtros por estado de envio, datas e pesquisa | ✅ | Filtro de estado corre na API |
| Estado de envio (a processar → entregue) | ✅ | |
| Histórico de alterações | ✅ | Timeline a partir dos logs |
| Factura e recibo em PDF | ✅ | |
| Notas internas | ❌ | |

## 4. Clientes

| Funcionalidade | Estado | Notas |
|---|---|---|
| Listar clientes | ✅ | |
| Ficha do cliente (dados, endereços) | ✅ | Dados pessoais só com `customers.pii.read` |
| Histórico de compras na ficha | ❌ | |
| Grupos / segmentos | ❌ | |

## 5. Pagamentos

| Funcionalidade | Estado | Notas |
|---|---|---|
| Listar transações | ✅ | |
| Conciliação de pagamentos | ✅ | `ReconcilePaymentSheet` |
| Reembolsos | ❌ | |

## 6. Marketing e conteúdo

| Funcionalidade | Estado | Notas |
|---|---|---|
| Cupões | ✅ | |
| Leads comerciais | ✅ | Com follow-up |
| Banners | ✅ | |
| Page Builder (home da loja) | ✅ | |
| Biblioteca de media | ✅ | |
| Descontos automáticos | ❌ | Só desconto por produto |

## 7. Analytics

| Funcionalidade | Estado | Notas |
|---|---|---|
| KPIs com comparação ao período anterior | ✅ | |
| Gráfico de receita | ✅ | |
| Produtos e clientes de topo | ✅ | |
| Vendas por país, estado dos pagamentos | ✅ | |
| Exportar relatórios | ❌ | |

## 8. Definições

| Funcionalidade | Estado | Notas |
|---|---|---|
| Dados da loja, aparência, envios, manutenção | ✅ | Grupo "Loja" |
| Integração Meta | ✅ | |
| Notificações | Parcial | Telegram; sem e-mail |
| Equipa e cargos | ✅ | Convites incluídos |
| Tokens de API | ✅ | |
| Métodos de pagamento | ❌ | |
| Impostos | ❌ | |

## 9. Layout e UX

| Funcionalidade | Estado | Notas |
|---|---|---|
| Sidebar por secções, só com o que o utilizador pode abrir | ✅ | `lib/nav.ts` |
| Cabeçalho e toolbars consistentes | ✅ | `PageToolbar` em todas as listas |
| Estados vazios e erros de carregamento | ✅ | `EmptyState`, `LoadError` |
| Esqueletos de carregamento | ✅ | Listas e Analytics |
| Toasts | ✅ | |
| Tema claro / escuro / sistema | ✅ | Tokens semânticos em `globals.css` |
| Pesquisa global (produtos, pedidos, clientes) | ❌ | |
| Responsivo (mobile) | ? | Por testar página a página |

---

## Próximos passos sugeridos

Por impacto para quem opera a loja todos os dias:

1. **Home "precisa de atenção"**: pedidos por processar, stock baixo, pagamentos por conciliar.
2. **Histórico de compras na ficha do cliente.**
3. **Pesquisa global** (atalho de teclado) para pedidos, produtos e clientes.
4. **Notas internas nos pedidos.**
5. **Reembolsos.**
6. **SEO por produto.**
