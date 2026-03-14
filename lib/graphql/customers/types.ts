/**
 * Tipos para customer details (com endereços) – alinhados ao schema do gateway.
 */

export interface DomainModel {
  code: string
  description: string
}

export interface AddressResponse {
  id: string
  type?: DomainModel
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  metadata?: string
  status?: DomainModel
  isDefault?: boolean
  customerId?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerDetailsResponse {
  id: string
  customerExternalId?: string
  name?: string
  description?: string
  provider?: DomainModel
  identifier?: string
  email?: string
  phone?: string
  metadata?: string
  status?: DomainModel
  createdAt?: string
  updatedAt?: string
  addresses?: AddressResponse[]
}
