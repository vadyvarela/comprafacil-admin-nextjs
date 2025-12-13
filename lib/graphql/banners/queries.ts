import { gql } from "@apollo/client";

export const GET_BANNERS = gql`
  query GetBanners {
    banners {
      id
      title
      subtitle
      description
      image
      link
      buttonText
      status {
        code
        description
      }
      orderIndex
      startDate
      endDate
      position
      createdAt
      updatedAt
    }
  }
`;

export const GET_BANNER = gql`
  query GetBanner($id: UUID!) {
    bannerDetails(id: $id) {
      id
      title
      subtitle
      description
      image
      link
      buttonText
      status {
        code
        description
      }
      orderIndex
      startDate
      endDate
      position
      createdAt
      updatedAt
    }
  }
`;

