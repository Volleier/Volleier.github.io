import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://volleier.github.io',
  integrations: [
    react(),
    vue(),
    tailwind()
  ]
});
