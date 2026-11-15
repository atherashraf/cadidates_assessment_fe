import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_URL?.trim().replace(/\/+$/, "");
  const proxyToken = env.WASA_API_TOKEN?.trim();
  const authHeader = proxyToken ? { Authorization: `Bearer ${proxyToken}` } : undefined;
  // Strip /api so Vite → FastAPI matches nginx (BE routes are /auth, /dch, …).
  const stripApiPrefix = (path: string) => path.replace(/^\/api(?=\/|$)/, "") || "/";
  const proxyConfig = apiBaseUrl
      ? {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          headers: authHeader,
          rewrite: stripApiPrefix,
        },
        "/media": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          headers: authHeader,
        },
      }
      : undefined;

  return {
    base: "/",
    plugins: [react()],

    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@damap": resolve(__dirname, "src/libs/damap")
      },
      // react: resolve(__dirname, 'node_modules/react'),
      //'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      //'@emotion/react': resolve(__dirname, 'node_modules/@emotion/react'),
      //'@emotion/styled': resolve(__dirname, 'node_modules/@emotion/styled'),
      // ensure single instances when damap is linked
      //dedupe: ["react", "react-dom", "@emotion/react", "@emotion/styled"]
    },

    server: {
      port: parseInt(env.VITE_DEV_PORT || "5176", 10),
      fs: {
        allow: [".."]
      },
      // Dev-only proxy. Production does not use Vite's dev server.
      proxy: proxyConfig,
    },

    assetsInclude: ["**/*.pdf"]
  };
});
