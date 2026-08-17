import { gql } from "@apollo/client"

export const CREATE_MARKETING_THREAD = gql`
  mutation CreateMarketingThread($title: String) {
    createMarketingThread(title: $title) {
      id
      title
      createdAt
      updatedAt
      messageCount
    }
  }
`

export const APPEND_MARKETING_MESSAGE = gql`
  mutation AppendMarketingMessage(
    $threadId: UUID!
    $role: String!
    $content: String!
    $toolCalls: JSON
  ) {
    appendMarketingMessage(
      threadId: $threadId
      role: $role
      content: $content
      toolCalls: $toolCalls
    ) {
      id
      threadId
      role
      content
      createdAt
    }
  }
`

export const CREATE_MARKETING_PROPOSAL = gql`
  mutation CreateMarketingProposal($input: MarketingProposalInput!) {
    createMarketingProposal(input: $input) {
      id
      threadId
      campaignId
      type
      title
      payload
      status
      createdAt
    }
  }
`

export const UPDATE_MARKETING_PROPOSAL = gql`
  mutation UpdateMarketingProposal($id: UUID!, $payload: JSON, $title: String) {
    updateMarketingProposal(id: $id, payload: $payload, title: $title) {
      id
      threadId
      campaignId
      type
      title
      payload
      status
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_MARKETING_PROPOSAL_STATUS = gql`
  mutation UpdateMarketingProposalStatus(
    $id: UUID!
    $status: String!
    $appliedNote: String
    $campaignId: UUID
  ) {
    updateMarketingProposalStatus(
      id: $id
      status: $status
      appliedNote: $appliedNote
      campaignId: $campaignId
    ) {
      id
      campaignId
      status
      appliedAt
      appliedNote
    }
  }
`

export const SAVE_MARKETING_WEEKLY_OFFER = gql`
  mutation SaveMarketingWeeklyOffer($input: MarketingWeeklyOfferInput!) {
    saveMarketingWeeklyOffer(input: $input) {
      id
      weeklyOffer
      latestImages
      updatedAt
    }
  }
`

export const RECORD_MARKETING_IMAGE = gql`
  mutation RecordMarketingImage($input: MarketingImageRecordInput!) {
    recordMarketingImage(input: $input) {
      id
      latestImages
      updatedAt
    }
  }
`

const MARKETING_CAMPAIGN_MUTATION_FIELDS = gql`
  fragment MarketingCampaignMutationFields on MarketingCampaignResponse {
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

export const CREATE_MARKETING_CAMPAIGN = gql`
  mutation CreateMarketingCampaign($input: MarketingCampaignInput!) {
    createMarketingCampaign(input: $input) {
      ...MarketingCampaignMutationFields
    }
  }
  ${MARKETING_CAMPAIGN_MUTATION_FIELDS}
`

export const UPDATE_MARKETING_CAMPAIGN = gql`
  mutation UpdateMarketingCampaign($id: UUID!, $input: MarketingCampaignInput!) {
    updateMarketingCampaign(id: $id, input: $input) {
      ...MarketingCampaignMutationFields
    }
  }
  ${MARKETING_CAMPAIGN_MUTATION_FIELDS}
`

export const SET_MARKETING_CAMPAIGN_STATUS = gql`
  mutation SetMarketingCampaignStatus($id: UUID!, $status: String!) {
    setMarketingCampaignStatus(id: $id, status: $status) {
      ...MarketingCampaignMutationFields
    }
  }
  ${MARKETING_CAMPAIGN_MUTATION_FIELDS}
`

export const ATTACH_MARKETING_CAMPAIGN_ASSETS = gql`
  mutation AttachMarketingCampaignAssets(
    $id: UUID!
    $bannerIds: [UUID!]
    $couponIds: [UUID!]
    $imageUrls: [String!]
  ) {
    attachMarketingCampaignAssets(
      id: $id
      bannerIds: $bannerIds
      couponIds: $couponIds
      imageUrls: $imageUrls
    ) {
      ...MarketingCampaignMutationFields
    }
  }
  ${MARKETING_CAMPAIGN_MUTATION_FIELDS}
`
