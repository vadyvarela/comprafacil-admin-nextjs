import { gql } from "@apollo/client"

export const DASHBOARD_STATS = gql`
  query DashboardStats($filter: SalesReportFilter) {
    salesSummary(filter: $filter) {
      totalRevenue
      totalProductSold
    }
    paymentStatusSummary {
      status {
        code
        description
      }
      quantity
    }
  }
`
