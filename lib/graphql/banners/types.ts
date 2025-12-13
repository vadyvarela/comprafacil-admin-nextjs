export interface BannerStatus {
  code: string;
  description: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image: string;
  link?: string | null;
  buttonText?: string | null;
  status: BannerStatus;
  orderIndex?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BannerRequest {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image: string;
  link?: string | null;
  buttonText?: string | null;
  status?: BannerStatus | null;
  orderIndex?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: string | null;
}

