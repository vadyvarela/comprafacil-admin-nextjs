export type DeliveryMethod = "HOME" | "PICKUP"

export interface ShippingTierGql {
  id: string
  islandLocationId: string
  islandName?: string | null
  deliveryMethod: DeliveryMethod
  minSubtotal: number
  maxSubtotal?: number | null
  shippingPrice: number
  minDays?: number | null
  maxDays?: number | null
  etaLabel?: string | null
  sortOrder?: number | null
}

export interface PickupPointGql {
  id: string
  islandLocationId: string
  name: string
  address1?: string | null
  city?: string | null
  sortOrder?: number | null
}

export interface LocationGql {
  id: string
  name: string
}

export interface ShippingTiersQueryData {
  shippingTiers: ShippingTierGql[]
}

export interface PickupPointsQueryData {
  pickupPoints: PickupPointGql[]
}

export interface CountriesQueryData {
  countries: LocationGql[]
}

export interface StatesQueryData {
  states: LocationGql[]
}

export interface IslandsQueryData {
  locations: LocationGql[]
}
