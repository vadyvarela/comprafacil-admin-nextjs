import { gql } from "@apollo/client"

export const MARKETING_DESK = gql`
  query MarketingDesk {
    marketingDesk {
      id
      weeklyOffer
      latestImages
      updatedAt
    }
  }
`

export const MARKETING_THREADS = gql`
  query MarketingThreads {
    marketingThreads {
      id
      title
      createdAt
      updatedAt
      messageCount
    }
  }
`

export const MARKETING_THREAD = gql`
  query MarketingThread($id: UUID!) {
    marketingThread(id: $id) {
      thread {
        id
        title
        createdAt
        updatedAt
        messageCount
      }
      messages {
        id
        threadId
        role
        content
        toolCalls
        createdAt
      }
      proposals {
        id
        threadId
        campaignId
        type
        title
        payload
        status
        appliedAt
        appliedNote
        createdAt
        updatedAt
      }
    }
  }
`

export const MARKETING_PROPOSALS = gql`
  query MarketingProposals($status: String, $campaignId: UUID) {
    marketingProposals(status: $status, campaignId: $campaignId) {
      id
      threadId
      campaignId
      type
      title
      payload
      status
      appliedAt
      appliedNote
      createdAt
      updatedAt
    }
  }
`

const MARKETING_CAMPAIGN_FIELDS = gql`
  fragment MarketingCampaignFields on MarketingCampaignResponse {
    id
    name
    objective
    status
    startDate
    endDate
    channels
    brief
    headline
    hook
    facebookPost
    instagramCaption
    whatsappText
    productIds
    bannerIds
    couponIds
    imageUrls
    destinationType
    destinationHref
    slug
    pageTheme
    siteTopEnabled
    siteTopText
    siteTopSubtext
    siteTopCtaLabel
    siteTopCtaHref
    siteTopSecondaryCtaLabel
    siteTopSecondaryCtaHref
    createdAt
    updatedAt
  }
`

export const MARKETING_CAMPAIGNS = gql`
  query MarketingCampaigns {
    marketingCampaigns {
      ...MarketingCampaignFields
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`

export const MARKETING_CAMPAIGN = gql`
  query MarketingCampaign($id: UUID!) {
    marketingCampaign(id: $id) {
      ...MarketingCampaignFields
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`

export const MARKETING_LIVE_CAMPAIGN = gql`
  query MarketingLiveCampaign {
    marketingLiveCampaign {
      ...MarketingCampaignFields
    }
  }
  ${MARKETING_CAMPAIGN_FIELDS}
`
