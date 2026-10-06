"use client"

import { useCallback, useSyncExternalStore } from "react"
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/lib/theme-script"

/**
 * Tema do admin: claro, escuro ou o do sistema operativo.
 *
 * A escolha fica no localStorage deste browser. A classe `.dark` vai no
 * `<html>`, que é o que o `@custom-variant dark` e os tokens de globals.css
 * esperam. `THEME_INIT_SCRIPT` (theme-script.ts) aplica-a antes da primeira
 * pintura, para a página não piscar em claro.
 */

export type ThemePreference = "light" | "dark" | "system"

const CHANGE_EVENT = "admin-theme-change"

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyPreference(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && systemPrefersDark())
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.style.colorScheme = dark ? "dark" : "light"
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const onSystemChange = () => {
    if (readPreference() === "system") applyPreference("system")
    onChange()
  }
  media.addEventListener("change", onSystemChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    media.removeEventListener("change", onSystemChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/** Preferência guardada e o tema que resulta dela agora. */
export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const)
  const resolved = useSyncExternalStore<"light" | "dark">(
    subscribe,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light"
  )

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sem storage (modo privado): aplica só a esta página.
    }
    applyPreference(next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { preference, resolved, setPreference }
}
