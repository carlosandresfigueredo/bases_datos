/** @type {import('next').NextConfig} */
const nextConfig = {
  // sql.js carga su binario WASM directamente desde node_modules en el servidor.
  // No se necesita configuración especial de webpack/turbopack para rutas API (server-side).
  turbopack: {},
};

export default nextConfig;
