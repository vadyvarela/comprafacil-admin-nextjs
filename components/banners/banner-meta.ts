export const POSITION_LABEL: Record<string, string> = {
  hero: "Hero",
  "hero-side": "Lateral",
  promo: "Promo",
  sidebar: "Sidebar",
}

const LOCAL_LINK = /^(?:https?:)?(?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?:[:/?#]|$)/i

/** Um link local só funciona na máquina de quem o copiou, nunca para o cliente. */
export function isLocalLink(link: string) {
  return LOCAL_LINK.test(link.trim())
}
