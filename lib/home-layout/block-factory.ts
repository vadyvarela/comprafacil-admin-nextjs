import type { HomeBlock } from "./schema"
import type { HomeBlockType } from "./registry"

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function createEmptyBlock(type: HomeBlockType): HomeBlock {
  const id = newId()
  switch (type) {
    case "hero":
      return { id, type: "hero", enabled: true, props: {} }
    case "productRail":
      return {
        id,
        type: "productRail",
        enabled: true,
        props: {
          variant: "newest",
          title: "Nova secção",
          limit: 8,
          seeAllHref: "/produtos?sort=newest",
        },
      }
    case "categoryRail":
      return {
        id,
        type: "categoryRail",
        enabled: true,
        props: {
          categorySlug: "smartphones",
          limit: 5,
          seeAllHref: "/categoria/smartphones",
        },
      }
    case "multiCategoryRails":
      return {
        id,
        type: "multiCategoryRails",
        enabled: true,
        props: { maxSections: 3 },
      }
    case "newsletter":
      return { id, type: "newsletter", enabled: true, props: {} }
    case "recentlyViewed":
      return { id, type: "recentlyViewed", enabled: true, props: { limit: 8 } }
  }
}
