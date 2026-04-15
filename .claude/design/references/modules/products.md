# Módulo: Produtos (Products)

## Lista de Produtos
Layout: Grid view / Table view toggle + Filters + Search

### Views
**Grid Card** (padrão): img + nome + preço + estoque badge + status toggle + quick actions
**Table view**: Checkbox | Img | Nome | SKU | Preço | Estoque | Categoria | Status | Ações

### Filtros
- Search: nome, SKU, descrição
- Categoria (multi-select)
- Status: Ativo/Inativo/Rascunho
- Estoque: Disponível/Baixo estoque/Esgotado
- Faixa de preço (slider)

## Formulário de Produto (page /products/new ou /products/[id])

```
Layout 2 colunas (2/3 + 1/3):

Coluna Principal:
  - Nome do produto (input)
  - Descrição (rich text / textarea)
  - Galeria de imagens (drag & drop upload)
  - Variantes (tamanho, cor, etc.) — tabela editável
  - SEO (slug, meta title, meta description)

Sidebar:
  - Status (Select: Ativo/Inativo/Rascunho)
  - Publicar em (DatePicker)
  - Categoria (Select com search)
  - Tags (input tags)
  - Preço + Preço Promocional
  - Estoque atual
  - SKU + Código de barras
```

## Tipos TypeScript
```tsx
interface Product {
  id: string
  name: string
  slug: string
  description: string
  images: string[]
  price: number
  comparePrice?: number
  sku: string
  stock: number
  category: string
  tags: string[]
  status: 'active' | 'inactive' | 'draft'
  variants: ProductVariant[]
  createdAt: string
}
```

## Badge de Estoque
```tsx
stock > 10  → emerald "Em estoque (42)"
stock 1-10  → amber "Baixo estoque (3)"
stock === 0 → rose "Esgotado"
```
