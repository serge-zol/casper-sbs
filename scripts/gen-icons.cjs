// Generates PWA icons from cat-paw.png: removes white bg, composites on #053E35
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SRC = path.resolve(__dirname, '../public/cat-paw.png')
const OUT = path.resolve(__dirname, '../public')

async function removeWhiteBg(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Remove near-white pixels (preserves orange: high R, low-mid G, low B)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (r > 220 && g > 200 && b > 200) {
      data[i + 3] = 0
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer()
}

async function createIcon(pawBuffer, size, pawFraction, outputPath) {
  const pawSize = Math.round(size * pawFraction)
  const offset = Math.round((size - pawSize) / 2)

  const resized = await sharp(pawBuffer)
    .resize(pawSize, pawSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 5, g: 62, b: 53, alpha: 255 } },
  })
    .composite([{ input: resized, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toFile(outputPath)

  const kb = Math.round(fs.statSync(outputPath).size / 1024)
  console.log(`  ✓ ${path.basename(outputPath)} ${size}×${size}  paw=${Math.round(pawFraction * 100)}%  ${kb}KB`)
}

async function main() {
  console.log('Reading cat-paw.png and removing white background…')
  const pawBuffer = await removeWhiteBg(SRC)

  console.log('Generating icons:')
  await createIcon(pawBuffer, 512, 0.60, path.join(OUT, 'pwa-512x512.png'))
  await createIcon(pawBuffer, 192, 0.60, path.join(OUT, 'pwa-192x192.png'))
  await createIcon(pawBuffer, 64,  0.60, path.join(OUT, 'pwa-64x64.png'))
  // maskable: paw 40% — safe zone is inner 80% circle, so 40% leaves comfortable margin
  await createIcon(pawBuffer, 512, 0.40, path.join(OUT, 'maskable-icon-512x512.png'))
  await createIcon(pawBuffer, 180, 0.60, path.join(OUT, 'apple-touch-icon-180x180.png'))

  // Copy preview for agent output
  const dest = 'C:/Users/Zol/AppData/Roaming/Claude/local-agent-mode-sessions/ab12aa89-0afe-4712-a8b1-2f2d5bc1f5e5/d5d4fa9e-5eeb-460f-96e9-7e5d08708257/agent/local_ditto_d5d4fa9e-5eeb-460f-96e9-7e5d08708257/outputs/pwa-icon-new.png'
  fs.copyFileSync(path.join(OUT, 'pwa-192x192.png'), dest)
  console.log(`\nPreview copied → ${dest}`)
}

main().catch(err => { console.error(err); process.exit(1) })
