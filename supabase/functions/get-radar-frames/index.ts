import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { handleCors, createLogger, checkRateLimit, extractIdentifier, rateLimitExceededResponse } from "../_shared/mod.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/errorHandler.ts";

const FUNCTION_NAME = "get-radar-frames";

let cached:
  | {
      data: unknown;
      cachedAt: number;
    }
  | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = createLogger(FUNCTION_NAME);

  try {
    const identifier = extractIdentifier(req) || "unknown";
    const rateLimit = checkRateLimit({
      identifier,
      maxRequests: 120,
      windowMs: 60 * 60 * 1000,
    }, logger);

    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit, req);
    }

    // Simple in memory cache to reduce external calls
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      logger.debug("Returning cached radar frames");
      return createSuccessResponse({ source: "cache", data: cached.data }, 200, req);
    }

    logger.info("Fetching radar frames");

    const response = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "AllyByWaiter/1.0",
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      logger.warn("RainViewer request failed", { status: response.status, text: text.slice(0, 200) });
      return createErrorResponse(
        new Error("Failed to fetch radar data"),
        logger,
        { status: 502, request: req }
      );
    }

    const data = await response.json();
    cached = { data, cachedAt: Date.now() };

    logger.info("Radar frames fetched");
    return createSuccessResponse({ source: "live", data }, 200, req);
  } catch (error) {
    return createErrorResponse(error, logger, { status: 500, request: req });
  }
});
