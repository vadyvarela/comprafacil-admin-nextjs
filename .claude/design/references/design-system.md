# Design System Tokens

## Color Palette — Dark Theme (padrão)

```css
:root {
  /* Backgrounds */
  --bg-root:     #09090b;   /* zinc-950 — fundo raiz */
  --bg-surface:  #18181b;   /* zinc-900 — cards, sidebar */
  --bg-elevated: #27272a;   /* zinc-800 — hover, inputs */
  --bg-subtle:   #3f3f46;   /* zinc-700 — borders visíveis */

  /* Text */
  --text-primary:   #fafafa;   /* zinc-50 */
  --text-secondary: #a1a1aa;   /* zinc-400 */
  --text-muted:     #71717a;   /* zinc-500 */

  /* Accent (trocar por cor da marca) */
  --accent:         #6366f1;   /* indigo-500 */
  --accent-subtle:  rgba(99,102,241,0.12);

  /* Status */
  --status-pending:    #f59e0b;
  --status-processing: #3b82f6;
  --status-shipped:    #8b5cf6;
  --status-delivered:  #10b981;
  --status-cancelled:  #ef4444;
  --status-refunded:   #f97316;

  /* Border */
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.15);
}
```

## Tipografia

```tsx
// next/font
import { Sora } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

// Headings: Sora (weight 600-700)
// Body/UI: Geist Sans (weight 400-500)
// Números/Código: Geist Mono
```

## Spacing & Radius

```
Sidebar width:        240px (collapsed: 64px)
Topbar height:        56px
Content padding:      24px (px-6)
Card padding:         20px (p-5)
Stats card:           16px (p-4)

Border radius:
  Cards:    rounded-xl (12px)
  Buttons:  rounded-lg (8px)
  Badges:   rounded-full
  Inputs:   rounded-md (6px)
```

## Componentes shadcn Essenciais

```bash
npx shadcn@latest add button card badge table dialog sheet
npx shadcn@latest add dropdown-menu select input label
npx shadcn@latest add avatar skeleton tabs separator
npx shadcn@latest add chart command popover calendar
```

## Animações

```css
/* Entrada de conteúdo */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-enter { animation: fadeInUp 0.3s ease forwards; }

/* Staggered cards */
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 60ms; }
.card:nth-child(3) { animation-delay: 120ms; }
.card:nth-child(4) { animation-delay: 180ms; }
```

---

## Tailwind v4 — Mudanças Importantes

### Configuração (sem tailwind.config.js!)
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg-root:     #09090b;
  --color-bg-surface:  #18181b;
  --color-bg-elevated: #27272a;
  --color-accent:      #6366f1;
  --color-border:      rgba(255,255,255,0.08);

  --font-sans: "Geist", sans-serif;
  --font-mono: "Geist Mono", monospace;
  --font-display: "Sora", sans-serif;
}
```

### Uso no JSX — v4 usa CSS variables direto
```tsx
// v3 (não usar)
className="bg-zinc-950 text-zinc-50"

// v4 (preferir quando customizado)
className="bg-(--color-bg-root) text-white"

// Classes utilitárias padrão ainda funcionam
className="rounded-xl border p-5 flex items-center gap-4"
```

### Arbitrary values — mesma sintaxe
```tsx
className="bg-white/[0.03] border-white/[0.08]"
```

### Sem prefix de configuração — usar @theme para tokens custom
```css
@theme {
  --color-accent-subtle: color-mix(in srgb, #6366f1 12%, transparent);
  --radius-card: 12px;
  --radius-button: 8px;
}
```
