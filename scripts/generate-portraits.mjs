/**
 * generate-portraits.mjs
 * Creates optimised 3:4 portrait WebP crops from bride.jpg.jpeg and groom.jpg.jpeg
 * Run once: node scripts/generate-portraits.mjs
 */
import sharp from 'sharp'
import { join } from 'path'

const ASSETS = 'public/assets'

async function processImage({ src, dest, extractOptions, label }) {
  const img = sharp(join(ASSETS, src))
  const meta = await img.metadata()
  console.log(`${label}: ${meta.width}x${meta.height}`)

  let pipeline = img

  // Optional manual extract (top slice) before resize
  if (extractOptions) {
    pipeline = pipeline.extract(extractOptions)
  }

  const { size } = await pipeline
    .resize(600, 800, { fit: 'cover', position: 'north' })
    .webp({ quality: 80 })
    .toFile(join(ASSETS, dest))

  console.log(`  → ${dest}  (${Math.round(size / 1024)} KB)`)
}

await processImage({
  label: 'Bride',
  src:  'bride.jpg.jpeg',
  dest: 'bride-portrait.webp',
  // Face is at ~30% from top — "north" gravity keeps the upper portion which frames face + upper body
  extractOptions: null,
})

await processImage({
  label: 'Groom',
  src:  'groom.jpg.jpeg',
  dest: 'groom-portrait.webp',
  // Full-length standing shot, face at ~12% from top.
  // Extract top 55% of height first to crop out lower legs/floor before resize.
  extractOptions: null, // will be set after reading metadata
})

// Groom: read metadata, extract top 55%, then resize
const groomMeta = await sharp(join(ASSETS, 'groom.jpg.jpeg')).metadata()
const groomExtractH = Math.round(groomMeta.height * 0.55)
const { size: groomSize } = await sharp(join(ASSETS, 'groom.jpg.jpeg'))
  .extract({ left: 0, top: 0, width: groomMeta.width, height: groomExtractH })
  .resize(600, 800, { fit: 'cover', position: 'north' })
  .webp({ quality: 80 })
  .toFile(join(ASSETS, 'groom-portrait.webp'))

console.log(`  → groom-portrait.webp (top 55% crop)  (${Math.round(groomSize / 1024)} KB)`)
console.log('Done.')
