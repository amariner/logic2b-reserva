import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({ site: 'https://reserva.logic2b.com', trailingSlash: 'always', integrations: [react()] });
