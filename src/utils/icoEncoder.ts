/**
 * Encodes an array of PNG images into a .ico file (modern format with embedded PNGs).
 * Supports sizes up to 255×255 inline; passes 0 for 256-pixel dimension per ICO spec.
 */
export interface IcoImage {
  data: Uint8Array
  width: number
  height: number
}

export function encodeIco(images: IcoImage[]): Uint8Array {
  const HEADER_BYTES = 6
  const ENTRY_BYTES  = 16
  const n = images.length

  const imageDataTotal = images.reduce((sum, img) => sum + img.data.length, 0)
  const totalSize = HEADER_BYTES + ENTRY_BYTES * n + imageDataTotal

  const buffer = new ArrayBuffer(totalSize)
  const view   = new DataView(buffer)
  const bytes  = new Uint8Array(buffer)

  // ICONDIR header
  view.setUint16(0, 0, true)  // Reserved
  view.setUint16(2, 1, true)  // Type: 1 = icon
  view.setUint16(4, n, true)  // Image count

  let dataOffset = HEADER_BYTES + ENTRY_BYTES * n

  images.forEach((img, i) => {
    const base = HEADER_BYTES + i * ENTRY_BYTES
    // 0 means 256px per ICO spec
    bytes[base + 0] = img.width  >= 256 ? 0 : img.width
    bytes[base + 1] = img.height >= 256 ? 0 : img.height
    bytes[base + 2] = 0   // Color count (0 = true color)
    bytes[base + 3] = 0   // Reserved
    view.setUint16(base + 4, 1,              true) // Planes
    view.setUint16(base + 6, 32,             true) // Bit depth
    view.setUint32(base + 8, img.data.length, true) // Bytes in resource
    view.setUint32(base + 12, dataOffset,    true) // Offset to image data

    bytes.set(img.data, dataOffset)
    dataOffset += img.data.length
  })

  return bytes
}
