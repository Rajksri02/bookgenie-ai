// Utility functions for image cropping and fitting using Canvas API

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Set canvas dimensions to the cropped size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg', 0.95)
  })
}

export async function getFittedImg(imageSrc, targetAspectRatio = 2 / 3) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Determine the canvas size based on the target aspect ratio
  // We'll use the image's largest dimension to ensure high quality
  let canvasWidth, canvasHeight

  const imageAspectRatio = image.width / image.height

  if (imageAspectRatio > targetAspectRatio) {
    // Image is wider than target ratio
    canvasWidth = image.width
    canvasHeight = canvasWidth / targetAspectRatio
  } else {
    // Image is taller than target ratio
    canvasHeight = image.height
    canvasWidth = canvasHeight * targetAspectRatio
  }

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // 1. Draw blurred background for premium padding effect
  ctx.filter = 'blur(40px) brightness(0.8)'
  // Scale the image to cover the entire canvas (like object-fit: cover)
  const scale = Math.max(canvasWidth / image.width, canvasHeight / image.height)
  const bgWidth = image.width * scale
  const bgHeight = image.height * scale
  const bgX = (canvasWidth - bgWidth) / 2
  const bgY = (canvasHeight - bgHeight) / 2
  ctx.drawImage(image, bgX, bgY, bgWidth, bgHeight)

  // Reset filter
  ctx.filter = 'none'

  // 2. Draw the actual image centered (like object-fit: contain)
  const fitScale = Math.min(canvasWidth / image.width, canvasHeight / image.height)
  const fitWidth = image.width * fitScale
  const fitHeight = image.height * fitScale
  const fitX = (canvasWidth - fitWidth) / 2
  const fitY = (canvasHeight - fitHeight) / 2

  // Optional: add a subtle drop shadow behind the main image to separate it from the blurred background
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 10
  
  ctx.drawImage(image, fitX, fitY, fitWidth, fitHeight)

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg', 0.95)
  })
}
