import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: {
      ...minimal2023Preset.transparent,
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
    },
  },
  images: ['public/casper-icon.svg'],
})
