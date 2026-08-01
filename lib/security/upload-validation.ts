const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const ALLOWED_IMAGE_LABEL = "JPEG, PNG, WebP ou GIF"

function bytesStartWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value)
}

function isValidImageSignature(type: string, bytes: Uint8Array): boolean {
  if (type === "image/jpeg") {
    return bytesStartWith(bytes, [0xff, 0xd8, 0xff])
  }

  if (type === "image/png") {
    return bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  }

  if (type === "image/gif") {
    const header = new TextDecoder().decode(bytes.slice(0, 6))
    return header === "GIF87a" || header === "GIF89a"
  }

  if (type === "image/webp") {
    const riff = new TextDecoder().decode(bytes.slice(0, 4))
    const webp = new TextDecoder().decode(bytes.slice(8, 12))
    return riff === "RIFF" && webp === "WEBP"
  }

  return false
}

export async function validateImageBlob(
  value: Blob,
  fieldName = "ficheiro"
): Promise<string | null> {
  if (value.size <= 0) {
    return `${fieldName}: ficheiro vazio.`
  }

  if (value.size > MAX_IMAGE_SIZE_BYTES) {
    return `${fieldName}: ficheiro demasiado grande. Tamanho máximo: 10 MB.`
  }

  if (!ALLOWED_IMAGE_TYPES.has(value.type)) {
    return `${fieldName}: tipo não permitido (${value.type || "desconhecido"}). Use ${ALLOWED_IMAGE_LABEL}.`
  }

  const header = new Uint8Array(await value.slice(0, 16).arrayBuffer())
  if (!isValidImageSignature(value.type, header)) {
    return `${fieldName}: assinatura do ficheiro não corresponde ao tipo enviado.`
  }

  return null
}

export async function validateImageFormData(
  formData: FormData,
  fieldNames?: string[]
): Promise<string | null> {
  const names = fieldNames ?? [...new Set([...formData.keys()])]

  for (const name of names) {
    const values = formData.getAll(name)
    for (const value of values) {
      if (value instanceof Blob) {
        const error = await validateImageBlob(value, name)
        if (error) return error
      }
    }
  }

  return null
}

