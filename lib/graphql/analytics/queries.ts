import { gql } from "@apollo/client"

export const ANALYTICS_SALES_SUMMARY = gql`
  query AnalyticsSalesSummary($filter: SalesReportFilter) {
    salesSummary(filter: $filter) {
      totalRevenue
      totalProductSold
    }
  }
`

export const ANALYTICS_PAYMENT_STATUS = gql`
  query AnalyticsPaymentStatus {
    paymentStatusSummary {
      status {
        code
        description
      }
      quantity
    }
  }
`

export const ANALYTICS_WEEK_PURCHASE_REPORT = gql`
  query AnalyticsWeekPurchaseReport($filter: WeekPurchaseReportFilter) {
    weekPurchaseReport(filter: $filter) {
      date
      totalSales
      totalRevenue
    }
  }
`

export const ANALYTICS_LAST_SIX_MONTHS_REPORT = gql`
  query AnalyticsLastSixMonthsReport($filter: WeekPurchaseReportFilter) {
    lastSixMonthsPurchaseReport(filter: $filter) {
      date
      totalSales
      totalRevenue
    }
  }
`

export const ANALYTICS_PRODUCT_SALES_REPORT = gql`
  query AnalyticsProductSalesReport($filter: ProductSalesReportFilter) {
    productSalesReport(filter: $filter) {
      productId
      productTitle
      totalSold
      totalRevenue
    }
  }
`

export const ANALYTICS_CUSTOMER_PURCHASES = gql`
  query AnalyticsCustomerPurchases($filter: PurchasesFilter, $page: PageInput!) {
    customerPurchasesSummary(filter: $filter, page: $page) {
      data {
        customerId
        customerName
        totalSales
      }
      totalElements
    }
  }
`

export const ANALYTICS_COUNTRY_PURCHASES = gql`
  query AnalyticsCountryPurchases($filter: CountryPurchasesFilter, $page: PageInput!) {
    countryPurchasesSummary(filter: $filter, page: $page) {
      data {
        countryName
        totalSales
      }
      totalElements
    }
  }
`

export const ANALYTICS_SUCCESSFUL_PAYMENTS = gql`
  query AnalyticsSuccessfulPayments($filter: PurchasesFilter, $page: PageInput!) {
    successfulPaymentSummary(filter: $filter, page: $page) {
      data {
        paymentId
        merchantReference
        paymentDate
        currency
        customer {
          id
          name
          email
        }
        items {
          product
          variant
          quantity
          itemTotal
        }
      }
    }
  }
`
