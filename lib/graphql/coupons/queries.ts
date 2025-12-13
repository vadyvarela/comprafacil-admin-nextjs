import { gql } from "@apollo/client"

export const GET_COUPONS = gql`
  query GetCoupons {
    coupons {
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
      promotionCodeCount {
        count
        code
      }
      product {
        id
        title
      }
    }
  }
`

export const GET_COUPONS_BY_STATUS = gql`
  query GetCouponsByStatus($status: String!) {
    couponsByStatus(status: $status) {
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
      promotionCodeCount {
        count
        code
      }
      product {
        id
        title
      }
    }
  }
`

export const SEARCH_COUPONS = gql`
  query SearchCoupons($filter: CouponSearchRequest, $page: PageInput!) {
    searchCoupons(filter: $filter, page: $page) {
      data {
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
        promotionCodeCount {
          count
          code
        }
        product {
          id
          title
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`

export const GET_COUPON_DETAILS = gql`
  query GetCouponDetails($couponId: UUID!) {
    couponDetails(couponId: $couponId) {
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
      promotionCodeCount {
        count
        code
      }
      promotionCodes {
        id
        code
        maxRedemptions
        timesRedeemed
        expiresAt
        customerId
        status {
          code
          description
        }
        metadata
        defaultPromotion
        couponId
        createdAt
        updatedAt
      }
      product {
        id
        title
      }
    }
  }
`

