import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const analyzeHourlyRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "repopilot:analyze:hourly",
    })
  : null;

const analyzeDailyRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 d"),
      analytics: true,
      prefix: "repopilot:analyze:daily",
    })
  : null;

const chatHourlyRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "repopilot:chat:hourly",
    })
  : null;

const chatDailyRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(80, "1 d"),
      analytics: true,
      prefix: "repopilot:chat:daily",
    })
  : null;

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function normalizeRateLimitId(value: string) {
  return value.replace(/[^a-zA-Z0-9:_@.-]/g, "_").slice(0, 120);
}

function buildRateLimitKeys(req: NextRequest, routeName: string, userId?: string) {
  const ip = normalizeRateLimitId(getClientIp(req));

  const keys = [`${routeName}:ip:${ip}`];

  if (userId) {
    keys.push(`${routeName}:user:${normalizeRateLimitId(userId)}`);
  }

  return keys;
}

export async function checkAnalyzeRateLimit(
  req: NextRequest,
  userId?: string
) {
  return checkCombinedRateLimit(req, {
    routeName: "analyze",
    userId,
    hourlyLimiter: analyzeHourlyRateLimit,
    dailyLimiter: analyzeDailyRateLimit,
  });
}

export async function checkChatRateLimit(req: NextRequest, userId?: string) {
  return checkCombinedRateLimit(req, {
    routeName: "chat",
    userId,
    hourlyLimiter: chatHourlyRateLimit,
    dailyLimiter: chatDailyRateLimit,
  });
}

async function checkCombinedRateLimit(
  req: NextRequest,
  config: {
    routeName: string;
    userId?: string;
    hourlyLimiter: Ratelimit | null;
    dailyLimiter: Ratelimit | null;
  }
) {
  if (!config.hourlyLimiter || !config.dailyLimiter) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "Rate limiting is not configured. Please contact the site owner.",
        },
        { status: 500 }
      );
    }

    return null;
  }

  const keys = buildRateLimitKeys(req, config.routeName, config.userId);

  for (const key of keys) {
    const hourlyResult = await config.hourlyLimiter.limit(key);

    if (!hourlyResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          limitType: "hourly",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": hourlyResult.limit.toString(),
            "X-RateLimit-Remaining": hourlyResult.remaining.toString(),
            "X-RateLimit-Reset": hourlyResult.reset.toString(),
            "X-RateLimit-Window": "hourly",
          },
        }
      );
    }

    const dailyResult = await config.dailyLimiter.limit(key);

    if (!dailyResult.success) {
      return NextResponse.json(
        {
          error: "Daily usage limit reached. Please try again tomorrow.",
          limitType: "daily",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": dailyResult.limit.toString(),
            "X-RateLimit-Remaining": dailyResult.remaining.toString(),
            "X-RateLimit-Reset": dailyResult.reset.toString(),
            "X-RateLimit-Window": "daily",
          },
        }
      );
    }
  }

  return null;
}