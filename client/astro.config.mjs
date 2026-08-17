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
    remotePatterns: [{ protocol: 'https' }, { protocol: 'http' }]
  },
  output: 'server',
  adapter: vercel()
});
