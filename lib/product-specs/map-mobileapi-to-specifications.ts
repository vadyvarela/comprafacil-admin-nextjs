import type { MobileApiDeviceDetail, ProductSpecifications } from "./types"

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const s = String(value).trim()
  return s.length > 0 ? s : undefined
}

function setIf(specs: ProductSpecifications, key: string, value: unknown): void {
  const v = clean(value)
  if (v) specs[key] = v
}

/** Extrai tamanho do ecrã e resolução de `screen_resolution` (ex.: `6.3", 1206x2622 pixels`). */
function parseScreenResolution(raw?: string): { display?: string; resolution?: string } {
  if (!raw?.trim()) return {}
  const text = raw.trim()
  const inchMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:"|″|inches?)/i)
  const resMatch = text.match(/(\d+\s*x\s*\d+(?:\s*pixels?)?)/i)
  const display = inchMatch ? `${inchMatch[1]}"` : undefined
  const resolution = resMatch ? resMatch[1].replace(/\s+/g, " ") : text.includes("x") ? text : undefined
  return { display, resolution }
}

/** Separa RAM e processador de `hardware` (ex.: `12GB RAM, Apple A19 Pro`). */
function parseHardware(raw?: string): { ram?: string; processor?: string } {
  if (!raw?.trim()) return {}
  const text = raw.trim()
  const ramMatch = text.match(/(\d+\s*GB\s*RAM)/i)
  const ram = ramMatch ? ramMatch[1].replace(/\s+/g, " ") : undefined
  const withoutRam = ramMatch ? text.replace(ramMatch[0], "").replace(/^,\s*/, "").trim() : text
  const processor = withoutRam.replace(/^,\s*/, "").trim() || undefined
  return { ram, processor }
}

/** Parseia campos comuns na `description` da MobileAPI. */
function parseDescription(raw?: string): Partial<ProductSpecifications> {
  if (!raw?.trim()) return {}
  const text = raw
  const out: Partial<ProductSpecifications> = {}

  const osMatch = text.match(/\b(iOS\s*\d+(?:\.\d+)?|Android\s*\d+(?:\.\d+)?)\b/i)
  if (osMatch) out["Sistema operativo"] = osMatch[1]

  const ramMatch = text.match(/(\d+)\s*GB\s*RAM/i)
  if (ramMatch) out.RAM = `${ramMatch[1]} GB`

  const storageMatch = text.match(/(\d+)\s*GB\s*storage/i)
  if (storageMatch) out.Armazenamento = `${storageMatch[1]} GB`

  const chipsetMatch = text.match(/([\w\s]+?)\s+chipset/i)
  if (chipsetMatch) out.Processador = chipsetMatch[1].trim()

  const batteryMatch = text.match(/(\d+)\s*mAh\s*battery/i)
  if (batteryMatch) out.Bateria = `${batteryMatch[1]} mAh`

  const displayMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:"|″)\s*display/i)
  if (displayMatch) out.Ecrã = `${displayMatch[1]}"`

  return out
}

function formatBattery(value?: string | number): string | undefined {
  const v = clean(value)
  if (!v) return undefined
  if (/mah/i.test(v)) return v
  if (/^\d+$/.test(v)) return `${v} mAh`
  return v
}

export function mapMobileApiToSpecifications(device: MobileApiDeviceDetail): ProductSpecifications {
  const specs: ProductSpecifications = {}
  const screen = parseScreenResolution(device.screen_resolution)
  const hardware = parseHardware(device.hardware)
  const fromDescription = parseDescription(device.description)

  setIf(specs, "Ecrã", screen.display ?? fromDescription.Ecrã)
  setIf(specs, "Resolução", screen.resolution)
  setIf(specs, "Processador", hardware.processor ?? fromDescription.Processador)
  setIf(specs, "RAM", hardware.ram ?? fromDescription.RAM)
  setIf(specs, "Armazenamento", device.storage ?? fromDescription.Armazenamento)
  setIf(specs, "Câmara traseira", device.camera)
  setIf(specs, "Bateria", formatBattery(device.battery_capacity) ?? fromDescription.Bateria)
  setIf(specs, "Sistema operativo", fromDescription["Sistema operativo"])

  const weight = clean(device.weight)
  const thickness = clean(device.thickness)
  if (weight && thickness) {
    setIf(specs, "Dimensões", `${thickness} espessura`)
    setIf(specs, "Peso", weight)
  } else {
    setIf(specs, "Peso", weight)
    if (thickness) setIf(specs, "Dimensões", `${thickness} espessura`)
  }

  setIf(specs, "Cores disponíveis", device.colors)
  setIf(specs, "Lançamento", device.release_date)

  return specs
}

export function parseSpecificationsFromMetadata(
  metadataJson?: string | null
): ProductSpecifications {
  if (!metadataJson?.trim()) return {}
  try {
    const meta = JSON.parse(metadataJson) as { specifications?: unknown }
    const raw = meta.specifications
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
    const out: ProductSpecifications = {}
    for (const [key, value] of Object.entries(raw)) {
      const k = clean(key)
      const v = clean(value)
      if (k && v) out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

export function specificationsToMetadataField(
  specs: ProductSpecifications
): Record<string, string> | undefined {
  const cleaned: ProductSpecifications = {}
  for (const [key, value] of Object.entries(specs)) {
    const k = clean(key)
    const v = clean(value)
    if (k && v) cleaned[k] = v
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}
