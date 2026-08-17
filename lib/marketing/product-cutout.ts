import sharp from "sharp"

const BLOCK = 12
const GREEN_MIN = 88
const GREEN_EXCESS = 26

function pixel(data: Buffer, width: number, x: number, y: number) {
  const i = (y * width + x) * 4
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3], i }
}

function avgBlock(data: Buffer, width: number, height: number, x0: number, y0: number) {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  const x1 = Math.min(width, x0 + BLOCK)
  const y1 = Math.min(height, y0 + BLOCK)
  for (let y = Math.max(0, y0); y < y1; y += 1) {
    for (let x = Math.max(0, x0); x < x1; x += 1) {
      const p = pixel(data, width, x, y)
      r += p.r
      g += p.g
      b += p.b
      n += 1
    }
  }
  return { r: r / n, g: g / n, b: b / n }
}

function dist(a: { r: number; g: number; b: number }, r: number, g: number, b: number) {
  return Math.hypot(a.r - r, a.g - g, a.b - b)
}

function isChromaGreen(r: number, g: number, b: number) {
  return g >= GREEN_MIN && g - r >= GREEN_EXCESS && g - b >= GREEN_EXCESS
}

function isCheckerGray(r: number, g: number, b: number) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min > 14) return false
  return (max >= 118 && max <= 176) || (max >= 188 && max <= 236)
}

function keyGreen(data: Buffer) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (!isChromaGreen(r, g, b)) continue
    const excess = Math.min(g - r, g - b)
    const t = Math.min(1, Math.max(0, (excess - 18) / 55))
    data[i + 3] = Math.round(data[i + 3] * (1 - t))
    const spill = Math.max(0, g - Math.max(r, b))
    data[i + 1] = Math.max(Math.max(r, b), g - spill)
  }
}

function floodBackdrop(data: Buffer, width: number, height: number, seeds: Array<{ r: number; g: number; b: number }>) {
  const visited = new Uint8Array(width * height)
  const stack: number[] = []
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (visited[idx]) return
    visited[idx] = 1
    stack.push(idx)
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  const matches = (r: number, g: number, b: number) => {
    if (isCheckerGray(r, g, b)) return true
    return seeds.some((seed) => dist(seed, r, g, b) < 34)
  }

  while (stack.length) {
    const idx = stack.pop()!
    const i = idx * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (!matches(r, g, b)) continue
    data[i + 3] = 0
    const x = idx % width
    const y = (idx / width) | 0
    enqueue(x + 1, y)
    enqueue(x - 1, y)
    enqueue(x, y + 1)
    enqueue(x, y - 1)
  }
}

export async function punchBannerCutout(bytes: Uint8Array): Promise<Uint8Array> {
  const { data, info } = await sharp(Buffer.from(bytes))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const width = info.width
  const height = info.height
  const pixels = Buffer.from(data)

  const corners = [
    avgBlock(pixels, width, height, 0, 0),
    avgBlock(pixels, width, height, width - BLOCK, 0),
    avgBlock(pixels, width, height, 0, height - BLOCK),
    avgBlock(pixels, width, height, width - BLOCK, height - BLOCK),
  ]
  const chromaHits = corners.filter((c) => isChromaGreen(c.r, c.g, c.b)).length
  const checkerHits = corners.filter((c) => isCheckerGray(c.r, c.g, c.b)).length

  if (chromaHits >= 2) {
    keyGreen(pixels)
  } else {
    floodBackdrop(pixels, width, height, corners)
    if (checkerHits >= 2) keyGreen(pixels)
  }

  return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer()
}
