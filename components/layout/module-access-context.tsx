"use client"

import { createContext, useContext } from "react"

type ModuleAccessContextValue = {
  canWrite: boolean
}

const ModuleAccessContext = createContext<ModuleAccessContextValue>({
  canWrite: false,
})

export function ModuleAccessProvider({
  canWrite,
  children,
}: {
  canWrite: boolean
  children: React.ReactNode
}) {
  return (
    <ModuleAccessContext.Provider value={{ canWrite }}>
      {children}
    </ModuleAccessContext.Provider>
  )
}

export function useModuleAccess() {
  return useContext(ModuleAccessContext)
}
