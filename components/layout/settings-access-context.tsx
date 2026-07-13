"use client"

import { createContext, useContext } from "react"

type SettingsAccessContextValue = {
  isOwner: boolean
}

const SettingsAccessContext = createContext<SettingsAccessContextValue>({
  isOwner: false,
})

export function SettingsAccessProvider({
  isOwner,
  children,
}: {
  isOwner: boolean
  children: React.ReactNode
}) {
  return (
    <SettingsAccessContext.Provider value={{ isOwner }}>
      {children}
    </SettingsAccessContext.Provider>
  )
}

export function useSettingsAccess() {
  return useContext(SettingsAccessContext)
}
