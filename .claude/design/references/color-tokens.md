# Design Token System

## Tailwind Config Extension

Add to `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      bg: {
        base:    '#0A0A0F',
        surface: '#111118',
        raised:  '#16161E',
        overlay: '#1C1C26',
      },
      border: {
        subtle: 'rgba(255,255,255,0.06)',
        muted:  'rgba(255,255,255,0.10)',
        strong: 'rgba(255,255,255,0.16)',
      },
      text: {
        primary:   '#F1F0F5',
        secondary: '#8B8A9B',
        muted:     '#5A5970',
        disabled:  '#3A3A4A',
      },
      accent: {
        DEFAULT: '#4F6EF7',
        hover:   '#6B85FF',
        muted:   'rgba(79,110,247,0.12)',
        border:  'rgba(79,110,247,0.25)',
      },
      success: {
        DEFAULT: '#10B981',
        muted:   'rgba(16,185,129,0.10)',
      },
      warning: {
        DEFAULT: '#F59E0B',
        muted:   'rgba(245,158,11,0.10)',
      },
      danger: {
        DEFAULT: '#EF4444',
        muted:   'rgba(239,68,68,0.10)',
      },
    },
  }
}
```

## CSS Variables (globals.css)

```css
:root {
  --bg-base:    #0A0A0F;
  --bg-surface: #111118;
  --bg-raised:  #16161E;
  --bg-overlay: #1C1C26;

  --border-subtle: rgba(255,255,255,0.06);
  --border-muted:  rgba(255,255,255,0.10);

  --text-primary:   #F1F0F5;
  --text-secondary: #8B8A9B;
  --text-muted:     #5A5970;

  --accent:       #4F6EF7;
  --accent-hover: #6B85FF;
  --accent-muted: rgba(79,110,247,0.12);

  --success: #10B981;
  --warning: #F59E0B;
  --danger:  #EF4444;
}
```

## Usage Patterns

### Cards
```tsx
<div className="bg-[#111118] border border-white/[0.06] rounded-xl p-5">
```

### Elevated modal/drawer
```tsx
<div className="bg-[#16161E] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60">
```

### Input fields
```tsx
<input className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 placeholder:text-white/20 focus:border-[#4F6EF7]/50 focus:outline-none transition-colors" />
```

### Primary button
```tsx
<button className="bg-[#4F6EF7] hover:bg-[#6B85FF] text-white font-semibold px-4 py-2 rounded-lg transition-colors">
```

### Ghost button
```tsx
<button className="border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03] text-white/60 hover:text-white/90 px-4 py-2 rounded-lg transition-all">
```

## Font Import (layout.tsx)

```tsx
import { Bricolage_Grotesque, DM_Mono } from 'next/font/google'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})
```
