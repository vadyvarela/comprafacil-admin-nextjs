export interface StoreHomeLayoutGql {
  id?: string | null
  draftPayload?: unknown | null
  publishedPayload?: unknown | null
  publishedAt?: string | null
  updatedAt?: string | null
}

export interface StoreHomeLayoutQueryData {
  storeHomeLayout: StoreHomeLayoutGql | null
}

export interface StoreHomeLayoutMutationData {
  saveStoreHomeLayoutDraft: StoreHomeLayoutGql
  publishStoreHomeLayout: StoreHomeLayoutGql
}
