export interface StoreMaintenanceGql {
  id?: string | null
  enabled: boolean
  message?: string | null
  updatedAt?: string | null
}

export interface StoreMaintenanceQueryData {
  storeMaintenance: StoreMaintenanceGql
}

export interface StoreMaintenanceMutationData {
  updateStoreMaintenance: StoreMaintenanceGql
}
