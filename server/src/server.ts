import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import fetch from "cross-fetch";
import pkg from "@prisma/client";
const { PrismaClient } = pkg as typeof import("@prisma/client");
import { z } from "zod";

// 부팅 로그
console.log("[boot] loading env & starting...");

const {
  PORT = "4000",
  CLIENT_ORIGIN = "http://localhost:5173",
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  SESSION_SECRET
} = process.env;

// 필수 ENV 확인
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !SESSION_SECRET) {
  console.error("[boot] missing envs", {
    hasClientId: !!GOOGLE_CLIENT_ID,
    hasSecret: !!GOOGLE_CLIENT_SECRET,
    hasRedirect: !!GOOGLE_REDIRECT_URI,
    hasSession: !!SESSION_SECRET
  });
  throw new Error("Missing envs for Google OAuth or SESSION_SECRET");
}

const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const SESSION_COOKIE = "proton_sess";
type SessionPayload = { uid: string };

function setSession(res: express.Response, payload: SessionPayload) {
  const token = jwt.sign(payload, SESSION_SECRET!, { expiresIn: "14d" });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false, // 배포시 true(HTTPS)
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 3600 * 1000,
  });
}
function clearSession(res: express.Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    const decoded = jwt.verify(token, SESSION_SECRET!) as SessionPayload;
    (req as any).uid = decoded.uid;
    next();
  } catch (e) {
    console.error("[auth] invalid-session", e);
    return res.status(401).json({ error: "invalid-session" });
  }
}

// health 체크
app.get("/health", (_req, res) => res.json({ ok: true }));

// Google OAuth 시작
app.get("/api/auth/google/start", (req, res) => {
  const state = encodeURIComponent((req.query.redirect as string) || CLIENT_ORIGIN);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    state,
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// OAuth 콜백
app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const state = decodeURIComponent((req.query.state as string) || CLIENT_ORIGIN);
  if (!code) return res.status(400).send("Missing code");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("[oauth] token exchange failed:", text);
      return res.status(500).send("OAuth token exchange failed");
    }

    const tokens = await tokenRes.json() as { id_token: string };
    const payload = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());

    const GoogleUser = z.object({
      sub: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
      picture: z.string().url().optional(),
    });
    const g = GoogleUser.parse(payload);

    const user = await prisma.user.upsert({
      where: { googleId: g.sub },
      update: { email: g.email, name: g.name, picture: g.picture, lastLoginAt: new Date() },
      create: { googleId: g.sub, email: g.email, name: g.name, picture: g.picture },
    });

    setSession(res, { uid: user.id });
    res.redirect(state || CLIENT_ORIGIN);
  } catch (e) {
    console.error("[oauth] callback error:", e);
    res.status(500).send("OAuth error");
  }
});

// 현재 사용자
app.get("/api/me", requireUser, async (req, res) => {
  const uid = (req as any).uid as string;
  const me = await prisma.user.findUnique({ where: { id: uid } });
  res.json({ id: me?.id, email: me?.email, name: me?.name, picture: me?.picture });
});

// 로그아웃
app.post("/api/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

// 서버 시작 + 에러 핸들링
const server = app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Auth server on http://localhost:${PORT}`);
});
server.on("error", (err) => {
  console.error("[listen] error:", err);
  process.exit(1);
});

// 예외 로깅
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));
