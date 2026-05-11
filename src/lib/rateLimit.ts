import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const analyzeRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "repopilot:analyze",
    })
  : null;

const chatRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "repopilot:chat",
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

export async function checkAnalyzeRateLimit(req: NextRequest) {
  return checkRateLimit(req, analyzeRateLimit, "analyze");
}

export async function checkChatRateLimit(req: NextRequest) {
  return checkRateLimit(req, chatRateLimit, "chat");
}

async function checkRateLimit(
  req: NextRequest,
  limiter: Ratelimit | null,
  routeName: string
) {
  if (!limiter) {
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

  const ip = getClientIp(req);
  const key = `${routeName}:${ip}`;

  const result = await limiter.limit(key);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
        },
      }
    );
  }

  return null;
}