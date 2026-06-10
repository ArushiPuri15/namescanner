import { serve } from "@hono/node-server";
import { loadEnv } from "@namescanner/config";
import { createApp } from "./app.js";

const env = loadEnv();
const app = createApp(env);

serve(
  {
    fetch: app.fetch,
    port: env.API_PORT,
  },
  (info) => {
    console.log(`namescanner api listening on http://localhost:${info.port}`);
  },
);
