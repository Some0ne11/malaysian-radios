// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 'cloudfront.net' },
      { protocol: 'https', hostname: 'ik.imagekit.io' }
    ]
  },
  output: 'server',
  adapter: vercel({
    imageService: true
  })
});