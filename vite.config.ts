import { defineConfig } from 'vite';

export default defineConfig({
  base: '/cat_runrun/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr']
});
