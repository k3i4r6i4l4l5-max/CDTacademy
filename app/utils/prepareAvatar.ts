export async function prepareAvatar(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const size = Math.min(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(size, 256)
    const context = canvas.getContext('2d')
    if (!context || !size) throw new Error('Image is unavailable')

    const left = (image.naturalWidth - size) / 2
    const top = (image.naturalHeight - size) / 2
    context.drawImage(image, left, top, size, size, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/webp', 0.9)
  } finally {
    URL.revokeObjectURL(url)
  }
}
