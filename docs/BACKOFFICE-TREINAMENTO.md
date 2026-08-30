# Guia de Treinamento do Backoffice

Este guia serve para preparar utilizadores antes de usarem o backoffice em produção.
Use sempre ambiente de teste/staging no primeiro treinamento.

## Regras gerais

- Nunca treinar ações destrutivas diretamente em produção.
- Cada utilizador deve treinar apenas os módulos do seu cargo.
- Antes de eliminar, cancelar, remover token ou mudar estado crítico, confirmar o impacto no modal.
- Em caso de dúvida sobre pagamento, não reconciliar manualmente sem validação do responsável financeiro.
- Em caso de dúvida sobre envio, validar a regra de ilha/método antes de guardar.

## Cargos

- Proprietário: acesso total, equipa, segurança, tokens e definições críticas.
- Administrador: acesso total operacional e técnico.
- Gestor: catálogo, vendas, marketing, analytics, media e definições.
- Operador: pedidos e clientes.
- Visualizador: consulta de dashboard, produtos e pedidos.

## Roteiro recomendado

### 1. Orientação

- Login e saída.
- Menu lateral.
- Dashboard.
- Diferença entre modo leitura e ações de edição.
- Como reconhecer estados, badges e mensagens de erro.

### 2. Pedidos

- Procurar pedido por referência ou cliente.
- Filtrar por período.
- Interpretar pedido pago vs. estado de envio.
- Abrir detalhe do pedido.
- Consultar cliente, morada, itens e total.
- Alterar estado de envio apenas quando a etapa foi concluída.
- Cancelar pedido apenas com confirmação do responsável.

### 3. Produtos

- Abrir lista e filtros.
- Criar produto pelo fluxo oficial: Produtos > Novo produto.
- Guardar como rascunho antes de publicar.
- Definir categoria, marca, preço, stock e imagem.
- Entender diferença entre produto, variante e stock.
- Gerir galeria: primeira imagem e imagem de hover.
- Eliminar produto apenas quando autorizado.

### 4. Catálogo

- Criar e editar categorias.
- Entender categorias principais e subcategorias.
- Criar e editar marcas.
- Escolher imagem/logótipo pela Biblioteca sempre que possível.

### 5. Marketing e conteúdo

- Criar cupão.
- Criar código promocional dentro do cupão.
- Entender: cupão = regra de desconto; código = texto usado no checkout.
- Criar banner com imagem, posição, link e datas.
- Usar Biblioteca de media.
- No Page Builder: alterar, pré-visualizar, guardar rascunho e publicar.

### 6. Definições

- Loja: contactos, SEO e redes sociais.
- Aparência: presets, cores, header, footer e cartões.
- Envios: ilha, método, faixas de subtotal e pontos de levantamento.
- Notificações: token Telegram e chat IDs.
- Manutenção: activar apenas com autorização.
- Equipa e segurança: apenas owner/admin.

## Fases de melhoria UI/UX concluídas

### Fase 1. Segurança operacional

- Confirmações críticas usam modal interno do backoffice, não confirmação nativa do navegador.
- Acções de eliminar, cancelar, remover token, reconciliar pagamento e activar manutenção explicam impacto antes da confirmação.
- Perfis sem permissão vêem estados de leitura e não recebem atalhos de edição indevidos.

### Fase 2. Sistema visual base

- Cards, painéis, tabelas, inputs, textareas, selects, botões, dialogs e sheets foram alinhados visualmente.
- Foram adicionados estados vazios reutilizáveis para listas sem dados.
- Labels, descrições e erros de formulários ficaram mais consistentes para reduzir dúvida durante uso.

### Fase 3. Fluxos principais

- Dashboard, produtos, pedidos, clientes, transacções, logs, categorias, marcas, cupões, banners e media receberam polish de layout.
- Listas e tabelas foram ajustadas para melhor leitura, foco, hover, responsividade e acções por linha.
- O fluxo de criar produto foi unificado em Produtos > Novo produto.

### Fase 4. Definições e administração

- Loja, aparência, envios, notificações, manutenção, equipa, segurança e integrações ficaram mais organizadas por painéis.
- Formulários de definições críticas mostram contexto, estado e feedback visual antes de guardar.
- Biblioteca de media tem filtros, upload, selecção, vista grelha/lista e eliminação com confirmação interna.

### Fase 5. Validação

- UI validada por lint e build de produção.
- Varredura feita para remover `tracking-*`, `rounded-xl/2xl` e confirmações nativas.
- Servidor local confirmado em `http://localhost:3001`.

## Exercícios práticos

- Encontrar um pedido pago e marcar como "Em preparação".
- Confirmar entrega de um pedido de teste.
- Criar produto em rascunho com marca, categoria, imagem e variante.
- Publicar o produto depois de revisar.
- Criar cupão e gerar um código promocional.
- Criar banner com imagem da Biblioteca.
- Alterar uma faixa de envio em staging e testar checkout.
- Remover uma secção do Page Builder e usar confirmação.
- Convidar utilizador como Operador.

## Checklist antes de dar acesso à produção

- Utilizador entrou com o cargo correto.
- Utilizador conhece as ações que precisa executar.
- Utilizador sabe quais ações exigem autorização.
- Utilizador completou exercícios no ambiente de teste.
- Utilizador sabe interpretar mensagens de erro.
- Utilizador sabe quando chamar gestor/admin.

## Ações que exigem atenção extra

- Eliminar produto.
- Eliminar variante.
- Eliminar categoria, marca, cupão ou banner.
- Apagar transação.
- Remover ponto/faixa de envio.
- Cancelar ou reativar pedido.
- Enviar reconciliação de pagamento.
- Activar manutenção da loja.
- Remover/desativar token.
- Convidar ou promover membro para admin/owner.
