import { gql } from "@apollo/client"

export const UPSERT_SHIPPING_TIER = gql`
  mutation UpsertShippingTier($input: UpsertShippingTierInput!) {
    upsertShippingTier(input: $input) {
      id
      islandLocationId
      islandName
      deliveryMethod
      minSubtotal
      maxSubtotal
      shippingPrice
      minDays
      maxDays
      etaLabel
      sortOrder
    }
  }
`

export const DELETE_SHIPPING_TIER = gql`
  mutation DeleteShippingTier($id: UUID!) {
    deleteShippingTier(id: $id)
  }
`

export const UPSERT_PICKUP_POINT = gql`
  mutation UpsertPickupPoint($input: UpsertPickupPointInput!) {
    upsertPickupPoint(input: $input) {
      id
      islandLocationId
      name
      address1
      city
      sortOrder
    }
  }
`

export const DELETE_PICKUP_POINT = gql`
  mutation DeletePickupPoint($id: UUID!) {
    deletePickupPoint(id: $id)
  }
`
