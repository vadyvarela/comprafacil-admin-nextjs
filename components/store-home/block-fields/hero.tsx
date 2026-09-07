"use client"

/**
 * O Hero clássico não tem campos próprios: as imagens vêm dos banners.
 * Recebe as props do contrato comum, mas não precisa de nenhuma.
 */
export function HeroFields() {
  return (
    <p className="text-[13px] leading-relaxed text-muted-foreground">
      As imagens deste bloco são geridas em{" "}
      <span className="font-medium text-foreground">Marketing → Banners</span>,
      nas posições <code className="font-mono">hero</code> e{" "}
      <code className="font-mono">hero-side</code>.
    </p>
  )
}
