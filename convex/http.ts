import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// CORS configuration
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-fal-target-url",
  "Access-Control-Max-Age": "86400",
};

// Handle preflight requests
http.route({
  path: "/api/fal/proxy",
  method: "OPTIONS",
  handler: httpAction(
    async () =>
      new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      })
  ),
});

http.route({
  path: "/api/fal/proxy",
  method: "GET",
  handler: httpAction(async (_ctx, req) => handleFalProxy(req)),
});

http.route({
  path: "/api/fal/proxy",
  method: "POST",
  handler: httpAction(async (_ctx, req) => handleFalProxy(req)),
});

function validateTargetUrl(targetUrl: string | null): Response | URL {
  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: "Missing x-fal-target-url header" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid URL in x-fal-target-url header" }),
      {
        status: 412,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  const hostname = parsedUrl.hostname;
  const isValidDomain =
    hostname.endsWith(".fal.ai") ||
    hostname.endsWith(".fal.run") ||
    hostname === "fal.ai" ||
    hostname === "fal.run";

  if (!isValidDomain) {
    return new Response(
      JSON.stringify({
        error: "Target URL must point to *.fal.ai or *.fal.run domain",
      }),
      {
        status: 412,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  return parsedUrl;
}

function validateContentType(req: Request): Response | null {
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({
          error: "Unsupported Media Type. Only application/json is supported",
        }),
        {
          status: 415,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }
  }
  return null;
}

function buildProxyHeaders(req: Request, falKey: string): Headers {
  const proxyHeaders = new Headers();
  proxyHeaders.set("Authorization", `Key ${falKey}`);

  req.headers.forEach((value, key) => {
    if (
      key.toLowerCase() !== "authorization" &&
      key.toLowerCase() !== "host" &&
      key.toLowerCase() !== "x-fal-target-url"
    ) {
      proxyHeaders.set(key, value);
    }
  });

  return proxyHeaders;
}

function buildResponseHeaders(response: Response): Headers {
  const responseHeaders = new Headers(CORS_HEADERS);
  response.headers.forEach((value, key) => {
    if (
      key.toLowerCase() !== "content-length" &&
      key.toLowerCase() !== "content-encoding"
    ) {
      responseHeaders.set(key, value);
    }
  });
  return responseHeaders;
}

async function handleFalProxy(req: Request): Promise<Response> {
  // Validate HTTP method (already handled by router, but included for completeness)
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract and validate target URL
  const targetUrl = req.headers.get("x-fal-target-url");
  const urlValidation = validateTargetUrl(targetUrl);
  if (urlValidation instanceof Response) {
    return urlValidation;
  }

  // Validate content type
  const contentTypeError = validateContentType(req);
  if (contentTypeError) {
    return contentTypeError;
  }

  // Get FAL API key from environment
  const falKey = process.env.FAL_KEY;

  if (!falKey) {
    return new Response(
      JSON.stringify({ error: "FAL_KEY environment variable not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Prepare headers and request body
  const proxyHeaders = buildProxyHeaders(req, falKey);
  const requestInit: RequestInit = {
    method: req.method,
    headers: proxyHeaders,
  };

  if (req.method === "POST") {
    const body = await req.text();
    if (body) {
      requestInit.body = body;
    }
  }

  // Make the proxied request
  try {
    const response = await fetch(urlValidation.toString(), requestInit);
    const responseHeaders = buildResponseHeaders(response);
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to proxy request to Fal API",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default http;
