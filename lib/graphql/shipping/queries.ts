import { gql } from "@apollo/client"

export const GET_COUNTRIES = gql`
  query GetCountries {
    countries {
      id
      name
    }
  }
`

export const GET_STATES = gql`
  query GetStates($countryId: UUID!) {
    states(countryId: $countryId) {
      id
      name
    }
  }
`

export const GET_SHIPPING_TIERS = gql`
  query GetShippingTiers($islandLocationId: UUID, $deliveryMethod: DeliveryMethod) {
    shippingTiers(islandLocationId: $islandLocationId, deliveryMethod: $deliveryMethod) {
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

export const GET_PICKUP_POINTS = gql`
  query GetPickupPoints($islandLocationId: UUID!) {
    pickupPoints(islandLocationId: $islandLocationId) {
      id
      islandLocationId
      name
      address1
      city
      sortOrder
    }
  }
`
