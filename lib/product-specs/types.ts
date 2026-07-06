export type ProductSpecifications = Record<string, string>

export type SpecsSearchResult = {
  id: number
  name: string
  brand: string
  releaseDate?: string
  matchCertainty?: string
}

export type SpecsDetailResponse = {
  deviceId: number
  deviceName: string
  specifications: ProductSpecifications
}

export type MobileApiDeviceSummary = {
  id: number
  name?: string
  manufacturer_name?: string
  brand?: { name?: string }
  release_date?: string
  match_certainty?: string
  screen_resolution?: string
  camera?: string
  hardware?: string
  battery_capacity?: string | number
  storage?: string
  weight?: string
  thickness?: string
  description?: string
}

export type MobileApiDeviceDetail = MobileApiDeviceSummary & {
  colors?: string
  model_numbers?: string
}

export type MobileApiSearchResponse = {
  devices?: MobileApiDeviceSummary[]
}
