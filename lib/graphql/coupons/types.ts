export interface Coupon {
  id: string
  name: string
  percentOff?: number | null
  amountOff?: number | null
  currency?: string | null
  duration: string
  durationInMonths?: number | null
  maxRedemptions?: number | null
  redeemBy?: string | null
  appliesToProductId?: string | null
  status?: {
    code: string
    description: string
  } | null
  metadata?: string | null
  defaultCoupon?: boolean | null
  createdAt?: string
  updatedAt?: string
  promotionCodeCount?: {
    count: number
    code: string
  } | null
  product?: {
    id: string
    title: string
  } | null
}

export interface CouponDetails extends Coupon {
  promotionCodes?: PromotionCode[]
}

export interface PromotionCode {
  id: string
  code: string
  maxRedemptions: number
  timesRedeemed?: number | null
  expiresAt?: string | null
  customerId?: string | null
  status?: {
    code: string
    description: string
  } | null
  metadata?: string | null
  defaultPromotion?: boolean | null
  couponId: string
  createdAt?: string
  updatedAt?: string
}

export interface CouponPage {
  data: Coupon[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface CouponInput {
  name: string
  percentOff?: number | null
  amountOff?: number | null
  currency?: string | null
  duration: "ONCE" | "REPEATING" | "FOREVER"
  durationInMonths?: number | null
  maxRedemptions?: number | null
  redeemBy?: string | null
  appliesToProductId?: string | null
  status?: {
    code: string
  } | null
  metadata?: string | null
  defaultCoupon?: boolean | null
}

export interface CouponSearchRequest {
  name?: string | null
  percentOff?: number | null
  amountOff?: number | null
  currency?: string | null
  durationInMonths?: number | null
  maxRedemptions?: number | null
  redeemBy?: string | null
  appliesToProductId?: string | null
  status?: string | null
  search?: string | null
}

