import { gql } from "@apollo/client"

export const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CouponInput!) {
    createCoupon(input: $input) {
      id
      name
      percentOff
      amountOff
      currency
      duration
      durationInMonths
      maxRedemptions
      redeemBy
      appliesToProductId
      status {
        code
        description
      }
      metadata
      defaultCoupon
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: UUID!, $input: CouponInput!) {
    updateCoupon(id: $id, input: $input) {
      id
      name
      percentOff
      amountOff
      currency
      duration
      durationInMonths
      maxRedemptions
      redeemBy
      appliesToProductId
      status {
        code
        description
      }
      metadata
      defaultCoupon
      createdAt
      updatedAt
    }
  }
`

export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: UUID!) {
    deleteCoupon(id: $id) {
      id
      name
    }
  }
`

export const CREATE_PROMOTION_CODE = gql`
  mutation CreatePromotionCode($input: PromotionCodeInput!) {
    createPromotionCode(input: $input) {
      id
      code
      maxRedemptions
      timesRedeemed
      expiresAt
      couponId
      status {
        code
        description
      }
      createdAt
      updatedAt
    }
  }
`
