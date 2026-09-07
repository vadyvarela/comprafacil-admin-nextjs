"use client"

import type { ComponentType } from "react"
import type { HomeBlock } from "@/lib/home-layout/schema"
import type { HomeBlockType } from "@/lib/home-layout/registry"
import type { BlockFieldsProps } from "./block-fields/shared"

import { CategoryRailFields } from "./block-fields/category-rail"
import { HeroFields } from "./block-fields/hero"
import { HeroV2Fields } from "./block-fields/hero-v2"
import { MultiCategoryRailsFields } from "./block-fields/multi-category-rails"
import { NewsletterFields } from "./block-fields/newsletter"
import { ProductRailFields } from "./block-fields/product-rail"
import { PromoDuoFields } from "./block-fields/promo-duo"
import { RecentlyViewedFields } from "./block-fields/recently-viewed"
import { SectionIntroFields } from "./block-fields/section-intro"
import { ShoeStoreExploreFields } from "./block-fields/shoe-store-explore"
import { ShoeStoreHeroFields } from "./block-fields/shoe-store-hero"
import { ShopByCategoryFields } from "./block-fields/shop-by-category"
import { SplitDealRailFields } from "./block-fields/split-deal-rail"
import { WeeklyDealFields } from "./block-fields/weekly-deal"

/**
 * Editor de campos por tipo de bloco.
 *
 * Era um switch de 14 casos num ficheiro de 1901 linhas — `heroV2` sozinho
 * ocupava 385. Agora cada tipo tem o seu módulo e este mapa é a única coisa que
 * os liga: acrescentar um bloco é criar o módulo e uma linha aqui.
 *
 * O `Record` obriga o TypeScript a exigir uma entrada por tipo, por isso um
 * bloco novo sem editor é erro de compilação, não um ecrã vazio em produção.
 */
type FieldsComponent<T extends HomeBlockType> = ComponentType<
  BlockFieldsProps<Extract<HomeBlock, { type: T }>>
>

const BLOCK_FIELD_EDITORS: { [K in HomeBlockType]: FieldsComponent<K> } = {
  hero: HeroFields,
  heroV2: HeroV2Fields,
  shoeStoreHero: ShoeStoreHeroFields,
  shoeStoreExplore: ShoeStoreExploreFields,
  shopByCategory: ShopByCategoryFields,
  weeklyDeal: WeeklyDealFields,
  sectionIntro: SectionIntroFields,
  promoDuo: PromoDuoFields,
  splitDealRail: SplitDealRailFields,
  productRail: ProductRailFields,
  categoryRail: CategoryRailFields,
  multiCategoryRails: MultiCategoryRailsFields,
  newsletter: NewsletterFields,
  recentlyViewed: RecentlyViewedFields,
}

export function StoreHomeBlockFields({
  block,
  onChange,
}: BlockFieldsProps<HomeBlock>) {
  // O TypeScript não correlaciona a chave do mapa com o membro da união, mas o
  // tipo de `BLOCK_FIELD_EDITORS` garante que o par está certo. Cast único.
  const Fields = BLOCK_FIELD_EDITORS[block.type] as ComponentType<
    BlockFieldsProps<HomeBlock>
  >
  return <Fields block={block} onChange={onChange} />
}
