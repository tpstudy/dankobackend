interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

function validateApiKey(request: Request, env: Env): boolean {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === env.API_KEY;
}

async function handleGetPosts(env: Env): Promise<ApiResponse> {
  try {
    const stmt = env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC');
    const { results } = await stmt.all();
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: 'Failed to fetch posts' };
  }
}

async function handleGetPost(env: Env, id: number): Promise<ApiResponse> {
  try {
    const stmt = env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id);
    const result = await stmt.first();
    if (!result) {
      return { success: false, error: 'Post not found' };
    }
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to fetch post' };
  }
}

async function handleCreatePost(env: Env, data: { title: string; content: string }): Promise<ApiResponse> {
  try {
    const stmt = env.DB.prepare(
      'INSERT INTO posts (title, content) VALUES (?, ?) RETURNING *'
    ).bind(data.title, data.content);
    const result = await stmt.first();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to create post' };
  }
}

async function handleUpdatePost(
  env: Env,
  id: number,
  data: { title?: string; content?: string }
): Promise<ApiResponse> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    if (data.title) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.content) {
      updates.push('content = ?');
      values.push(data.content);
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    const stmt = env.DB.prepare(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    ).bind(...values, id);
    const result = await stmt.first();
    if (!result) {
      return { success: false, error: 'Post not found' };
    }
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to update post' };
  }
}

async function handleDeletePost(env: Env, id: number): Promise<ApiResponse> {
  try {
    const stmt = env.DB.prepare('DELETE FROM posts WHERE id = ? RETURNING id').bind(id);
    const result = await stmt.first();
    if (!result) {
      return { success: false, error: 'Post not found' };
    }
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, error: 'Failed to delete post' };
  }
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // API endpoints that require authentication
  const protectedEndpoints = ['POST', 'PUT', 'DELETE'];
  if (protectedEndpoints.includes(method) && !validateApiKey(request, env)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let response: ApiResponse;

  try {
    if (path === '/api/posts') {
      switch (method) {
        case 'GET':
          response = await handleGetPosts(env);
          break;
        case 'POST':
          const createData = await request.json();
          response = await handleCreatePost(env, createData);
          break;
        default:
          response = { success: false, error: 'Method not allowed' };
      }
    } else if (path.match(/^\/api\/posts\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0', 10);
      switch (method) {
        case 'GET':
          response = await handleGetPost(env, id);
          break;
        case 'PUT':
          const updateData = await request.json();
          response = await handleUpdatePost(env, id, updateData);
          break;
        case 'DELETE':
          response = await handleDeletePost(env, id);
          break;
        default:
          response = { success: false, error: 'Method not allowed' };
      }
    } else {
      response = { success: false, error: 'Not found' };
    }
  } catch (error) {
    response = { success: false, error: 'Internal server error' };
  }

  return new Response(JSON.stringify(response), {
    status: response.success ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
}