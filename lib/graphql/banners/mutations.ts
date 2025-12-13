import { gql } from "@apollo/client";

export const CREATE_BANNER = gql`
  mutation CreateBanner($input: BannerRequest!) {
    createBanner(input: $input) {
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

export const UPDATE_BANNER = gql`
  mutation UpdateBanner($id: UUID!, $input: BannerRequest!) {
    updateBanner(id: $id, input: $input) {
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

export const DELETE_BANNER = gql`
  mutation DeleteBanner($id: UUID!) {
    deleteBanner(id: $id) {
      id
    }
  }
`;

