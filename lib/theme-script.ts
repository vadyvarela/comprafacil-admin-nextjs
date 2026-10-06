// Fora de lib/theme.ts porque esse é "use client": um server component que
// importasse a string de lá recebia uma referência de cliente, não o texto.

export const THEME_STORAGE_KEY = "admin-theme"

/** Corre no <head>, antes da pintura: põe `.dark` no <html> conforme a escolha. */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`
