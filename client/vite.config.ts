import path from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const src = (...segments: string[]) =>
  path.resolve(import.meta.dirname, 'src', ...segments)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    // Keep in sync with `compilerOptions.paths` in tsconfig.app.json.
    alias: {
      '@api': src('api'),
      '@constants': src('constants'),
      '@hooks': src('hooks'),
      '@modules': src('modules'),
      '@providers': src('providers'),
      '@routes': src('routes'),
      '@shared': src('modules', 'shared'),
      '@stores': src('stores'),
      '@styles': src('styles'),
      // `@typings`, not `@types`: TypeScript reserves the `@types/` specifier
      // prefix for ambient type packages and rejects it as an import (TS6137).
      '@typings': src('types'),
      '@utils': src('utils'),
      '@': src(),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 2,
            },
            // entriesAware keeps dynamically imported packages (Shiki) out of
            // the eagerly loaded vendor chunk.
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              priority: 1,
              entriesAware: true,
            },
          ],
        },
      },
    },
  },
})
