import { renderHtml } from "./renderHtml";
import { handleRequest } from "./api";

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
      return handleRequest(request, env);
    }

    // Handle HTML preview (original functionality)
    const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
    const { results } = await stmt.all();

    return new Response(renderHtml(JSON.stringify(results, null, 2)), {
      headers: {
        "content-type": "text/html",
      },
    });
  },
} satisfies ExportedHandler<Env>;
