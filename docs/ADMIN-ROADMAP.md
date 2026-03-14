# Roadmap Admin – Layout Estilo Shopify

Plano para evoluir o admin para um layout profissional estilo Shopify, com todas as funcionalidades necessárias para gerir uma loja online.

---

## Funcionalidades de um Admin de Loja Online (Tipo Shopify)

### 1. **Catálogo (Produtos)**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Listar produtos (tabela, filtros) | ✅ Página existe | - |
| Criar/editar produto | ✅ Páginas existem | - |
| Imagens do produto | ? | Alta |
| Variantes (tamanho, cor, etc.) | ? | Alta |
| Stock / inventário | ? | Alta |
| SKU, preço, preço promocional | ? | Alta |
| SEO (meta title, description) | ? | Média |
| Publicar/desativar | ? | Alta |
| Importar/exportar (CSV) | ❌ | Baixa |

### 2. **Categorias e Organização**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Listar categorias | ✅ | - |
| Criar/editar categoria | ✅ | - |
| Árvore/hierarquia de categorias | ? | Média |
| Marcas (brands) | ✅ | - |
| Coleções / tags | ? | Média |

### 3. **Pedidos**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Listar pedidos | ✅ | - |
| Detalhe do pedido | ✅ | - |
| Filtros (estado, data, cliente) | Parcial | Alta |
| Atualizar estado (em processamento, enviado, etc.) | ? | Alta |
| Notas internas | ? | Média |
| Histórico de alterações | ? | Média |
| Impressão/PDF da fatura | ? | Média |

### 4. **Clientes**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Listar clientes | ❌ | Alta |
| Detalhe do cliente | ❌ | Alta |
| Histórico de compras | ❌ | Alta |
| Grupos/segmentos | ❌ | Baixa |

### 5. **Pagamentos e Transações**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Listar transações | ✅ | - |
| Reembolsos | ? | Alta |
| Conciliação | ? | Baixa |

### 6. **Promoções e Marketing**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Cupons | ✅ | - |
| Descontos automáticos | ❌ | Média |
| Banners / campanhas | ✅ | - |

### 7. **Relatórios e Analytics**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Dashboard com métricas (vendas, pedidos, etc.) | Parcial | Alta |
| Relatórios de vendas | ❌ | Média |
| Produtos mais vendidos | ❌ | Média |

### 8. **Definições / Configurações**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Dados da loja (nome, logo) | ❌ | Alta |
| Métodos de pagamento | ❌ | Alta |
| Envios/transportadoras | ❌ | Alta |
| Impostos | ❌ | Média |
| Utilizadores/equipa | ❌ | Média |
| Notificações por email | ❌ | Baixa |

### 9. **Layout e UX (Estilo Shopify)**
| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Sidebar colapsável com ícones | ✅ Básico | - |
| Header fixo com breadcrumb | ✅ Básico | - |
| Dashboard home com cards de resumo | Parcial | Alta |
| Empty states profissionais | Parcial | Média |
| Notificações / toast | ? | Média |
| Search global (produtos, pedidos) | ❌ | Média |
| Tema claro/escuro consistente | ? | Média |
| Responsivo (mobile) | ? | Alta |

---

## Plano de Implementação por Fases

### **Fase 1: Layout Profissional (Shell estilo Shopify)** ✅
Objetivo: base visual sólida, sem alterar funcionalidades atuais.

- [x] Header refinado: logo "Compra Fácil", breadcrumb, backdrop blur
- [x] Sidebar: agrupamento por secções (Principal, Vendas, Catálogo, Marketing)
- [x] Dashboard home: cards com métricas (Pedidos, Transações, Produtos) e acesso rápido
- [x] NavUser simplificado (Conta, Terminar sessão) e iniciais no avatar
- [ ] Empty states melhorados (fase posterior)

### **Fase 2: Catálogo e consistência de layout** (em curso)
- [x] Página de produtos: toolbar e lista alinhados ao estilo Pedidos
- [x] Criar produto: layout compacto e consistente
- [x] Categorias, Marcas, Cupons, Banners: mesmo padrão (toolbar + empty state)
- [ ] Filtros avançados por categoria (fase posterior)
- [ ] Categorias em árvore / hierárquicas (fase posterior)
- [ ] Gestão de stock já existe (StockModal no detalhe do produto)

### **Fase 3: Pedidos e Clientes** (em curso)
- [x] Detalhe do pedido: header compacto, link "Ver cliente"
- [x] Secção Clientes na sidebar (Vendas)
- [x] Página listagem clientes (placeholder; explica acesso via pedido)
- [x] Página detalhe cliente `/dashboard/customers/[id]` (dados + endereços)
- [ ] Workflow de estados do pedido (depende do backend: em processamento, enviado)
- [ ] Listagem de clientes (quando o backend expor o endpoint)
- [ ] Histórico de compras por cliente (fase posterior)

### **Fase 4: Relatórios e Dashboard**
- [ ] Gráficos de vendas
- [ ] Métricas por período
- [ ] Produtos mais vendidos
- [ ] Relatórios exportáveis

### **Fase 5: Configurações**
- [ ] Secção Definições
- [ ] Dados da loja
- [ ] Métodos de pagamento e envio (se aplicável)

---

## Próximo Passo: Fase 1

A **Fase 1** foca-se apenas no layout e na experiência visual, mantendo as páginas atuais funcionais. Inclui:

1. **Header estilo Shopify**: logo à esquerda, breadcrumb, área de ações à direita
2. **Sidebar organizada** em secções lógicas com ícones
3. **Dashboard home** com cards de resumo (se houver dados no backend)
4. **Consistência visual** em todo o admin

Posso começar pela Fase 1 quando confirmares.
