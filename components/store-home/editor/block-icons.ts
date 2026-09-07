import {
  Clock,
  Columns2,
  GalleryHorizontal,
  GalleryHorizontalEnd,
  Grid2x2,
  Heading,
  Images,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Mail,
  PanelsTopLeft,
  Tag,
  Timer,
  type LucideIcon,
} from "lucide-react"
import type { HomeBlockType } from "@/lib/home-layout/registry"

/**
 * Ícone por tipo de bloco.
 *
 * Fica fora de `lib/home-layout/registry.ts` de propósito: esse módulo é
 * importado por código de servidor e não deve arrastar dependências de React.
 */
export const HOME_BLOCK_ICONS: Record<HomeBlockType, LucideIcon> = {
  hero: Images,
  heroV2: LayoutTemplate,
  shoeStoreHero: GalleryHorizontal,
  shoeStoreExplore: LayoutGrid,
  shopByCategory: Grid2x2,
  weeklyDeal: Timer,
  sectionIntro: Heading,
  promoDuo: Columns2,
  splitDealRail: PanelsTopLeft,
  productRail: GalleryHorizontalEnd,
  categoryRail: Tag,
  multiCategoryRails: Layers,
  newsletter: Mail,
  recentlyViewed: Clock,
}
