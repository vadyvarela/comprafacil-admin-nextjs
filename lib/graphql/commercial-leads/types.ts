export type CommercialLeadFollowUpStatus =
  | "NEW"
  | "CONTACTED"
  | "NO_ANSWER"
  | "CONVERTED"
  | "LOST"

export interface CommercialLeadPageRequest {
  page?: number | null
  size?: number | null
  sortBy?: string | null
  sortDirection?: string | null
}

export interface CommercialLeadFilterRequest {
  search?: string | null
  followUpStatus?: CommercialLeadFollowUpStatus | null
  dateFrom?: string | null
  dateTo?: string | null
  dueOnly?: boolean | null
}

export interface CommercialLeadStatus {
  code: string
  description: string
}

export interface CommercialLeadCustomer {
  id: string
  name: string | null
  email: string | null
  phone: string | null
}

export interface CommercialLeadProduct {
  id: string
  title: string | null
  image: string | null
}

export interface CommercialLeadPaymentSummary {
  id: string
  merchantReference: string | null
  amount: number | null
  currency: string | null
  status: CommercialLeadStatus | null
  statusReason: string | null
  createdAt: string | null
}

export interface CommercialLeadFollowUp {
  id: string
  customerId: string
  productId: string
  status: CommercialLeadFollowUpStatus
  note: string | null
  lastContactedAt: string | null
  nextContactAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CommercialRecoveryLead {
  key: string
  customer: CommercialLeadCustomer
  product: CommercialLeadProduct
  contactPhone: string | null
  contactEmail: string | null
  latestPayment: CommercialLeadPaymentSummary
  attemptCount: number
  opportunityAmount: number
  currency: string
  lastAttemptAt: string
  computedStatus: CommercialLeadFollowUpStatus
  followUp: CommercialLeadFollowUp | null
}

export interface CommercialRecoveryLeadMetrics {
  totalActive: number
  newCount: number
  contactedCount: number
  noAnswerCount: number
  overdueCount: number
  potentialAmount: number
  currency: string
}

export interface CommercialRecoveryLeadPage {
  data: CommercialRecoveryLead[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  metrics: CommercialRecoveryLeadMetrics
}

export interface CommercialRecoveryLeadsResponse {
  commercialRecoveryLeads: CommercialRecoveryLeadPage
}

export interface UpsertCommercialLeadFollowUpInput {
  customerId: string
  productId: string
  status: CommercialLeadFollowUpStatus
  note?: string | null
  nextContactAt?: string | null
  contactedNow?: boolean | null
}

export interface UpsertCommercialLeadFollowUpResponse {
  upsertCommercialLeadFollowUp: CommercialLeadFollowUp
}
