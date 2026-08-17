function at(data: Buffer, width: number, x: number, y: number) {
  const i = (y * width + x) * 4
  return { r: data[i], g: data[i + 1], b: data[i + 2], i }
}

function chroma(r: number, g: number, b: number) {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

function dist(a: { r: number; g: number; b: number }, r: number, g: number, b: number) {
  return Math.hypot(a.r - r, a.g - g, a.b - b)
}

function isChromaGreen(r: number, g: number, b: number) {
  return g >= 80 && g - r >= 22 && g - b >= 22
}

function isLowChroma(r: number, g: number, b: number) {
  return chroma(r, g, b) <= 16
}

function keyGreen(data: Buffer) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (!isChromaGreen(r, g, b)) continue
    const excess = Math.min(g - r, g - b)
    const t = Math.min(1, Math.max(0, (excess - 16) / 50))
    data[i + 3] = Math.round(data[i + 3] * (1 - t))
    const spill = Math.max(0, g - Math.max(r, b))
    data[i + 1] = Math.max(Math.max(r, b), g - spill)
  }
}

function keyCheckerboard(data: Buffer, width: number, height: number) {
  const periods = [8, 12, 16, 24, 32]
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = at(data, width, x, y)
      if (!isLowChroma(p.r, p.g, p.b)) continue
      const hit = periods.some((period) => {
        const hx = x + period < width
        const hy = y + period < height
        const ox = x + (period >> 1) < width
        const oy = y + (period >> 1) < height
        if (!hx || !hy || !ox || !oy) return false
        const sameX = at(data, width, x + period, y)
        const sameY = at(data, width, x, y + period)
        const opp = at(data, width, x + (period >> 1), y + (period >> 1))
        return (
          dist(p, sameX.r, sameX.g, sameX.b) < 26 &&
          dist(p, sameY.r, sameY.g, sameY.b) < 26 &&
          dist(p, opp.r, opp.g, opp.b) > 28 &&
          isLowChroma(opp.r, opp.g, opp.b)
        )
      })
      if (hit) data[p.i + 3] = 0
    }
  }
}

function floodFlatBackdrop(data: Buffer, width: number, height: number) {
  const sample = (x0: number, y0: number) => {
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let y = y0; y < y0 + 10 && y < height; y += 1) {
      for (let x = x0; x < x0 + 10 && x < width; x += 1) {
        const p = at(data, width, x, y)
        r += p.r
        g += p.g
        b += p.b
        n += 1
      }
    }
    return { r: r / n, g: g / n, b: b / n }
  }

  const seeds = [
    sample(0, 0),
    sample(width - 10, 0),
    sample(0, height - 10),
    sample(width - 10, height - 10),
  ]

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

  const isBackdrop = (x: number, y: number, r: number, g: number, b: number) => {
    if (isChromaGreen(r, g, b)) return true
    if (!isLowChroma(r, g, b)) return false
    if (!seeds.some((seed) => dist(seed, r, g, b) < 48)) return false
    let minL = 255
    let maxL = 0
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const n = at(data, width, nx, ny)
        const l = (n.r + n.g + n.b) / 3
        if (l < minL) minL = l
        if (l > maxL) maxL = l
      }
    }
    return maxL - minL < 22
  }

  while (stack.length) {
    const idx = stack.pop()!
    const x = idx % width
    const y = (idx / width) | 0
    const i = idx * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (!isBackdrop(x, y, r, g, b)) continue
    data[i + 3] = 0
    enqueue(x + 1, y)
    enqueue(x - 1, y)
    enqueue(x, y + 1)
    enqueue(x, y - 1)
  }
}

function transparentRatio(data: Buffer) {
  let clear = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 16) clear += 1
  }
  return clear / (data.length / 4)
}

export async function punchBannerCutout(bytes: Uint8Array): Promise<Uint8Array> {
  try {
    const { default: sharp } = await import("sharp")
    const { data, info } = await sharp(Buffer.from(bytes))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const width = info.width
    const height = info.height
    const pixels = Buffer.from(data)

    keyGreen(pixels)
    keyCheckerboard(pixels, width, height)
    if (transparentRatio(pixels) < 0.12) {
      floodFlatBackdrop(pixels, width, height)
    }

    return sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer()
  } catch (err) {
    console.error("Recorte sharp indisponível, a usar a imagem original.", err)
    return bytes
  }
}
