"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var cookie_parser_1 = require("cookie-parser");
var jsonwebtoken_1 = require("jsonwebtoken");
var cross_fetch_1 = require("cross-fetch");
var client_1 = require("@prisma/client");
var PrismaClient = client_1.default.PrismaClient;
var zod_1 = require("zod");
// 부팅 로그
console.log("[boot] loading env & starting...");
var _a = process.env, _b = _a.PORT, PORT = _b === void 0 ? "4000" : _b, _c = _a.CLIENT_ORIGIN, CLIENT_ORIGIN = _c === void 0 ? "http://localhost:5173" : _c, GOOGLE_CLIENT_ID = _a.GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET = _a.GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI = _a.GOOGLE_REDIRECT_URI, SESSION_SECRET = _a.SESSION_SECRET;
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
var prisma = new PrismaClient();
var app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: CLIENT_ORIGIN, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
var SESSION_COOKIE = "proton_sess";
function setSession(res, payload) {
    var token = jsonwebtoken_1.default.sign(payload, SESSION_SECRET, { expiresIn: "14d" });
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: false, // 배포시 true(HTTPS)
        sameSite: "lax",
        path: "/",
        maxAge: 14 * 24 * 3600 * 1000,
    });
}
function clearSession(res) {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
}
function requireUser(req, res, next) {
    var token = req.cookies[SESSION_COOKIE];
    if (!token)
        return res.status(401).json({ error: "unauthorized" });
    try {
        var decoded = jsonwebtoken_1.default.verify(token, SESSION_SECRET);
        req.uid = decoded.uid;
        next();
    }
    catch (e) {
        console.error("[auth] invalid-session", e);
        return res.status(401).json({ error: "invalid-session" });
    }
}
// health 체크
app.get("/health", function (_req, res) { return res.json({ ok: true }); });
// Google OAuth 시작
app.get("/api/auth/google/start", function (req, res) {
    var state = encodeURIComponent(req.query.redirect || CLIENT_ORIGIN);
    var params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        include_granted_scopes: "true",
        state: state,
        prompt: "select_account",
    });
    res.redirect("https://accounts.google.com/o/oauth2/v2/auth?".concat(params.toString()));
});
// OAuth 콜백
app.get("/api/auth/google/callback", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var code, state, tokenRes, text, tokens, payload, GoogleUser, g, user, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                code = req.query.code;
                state = decodeURIComponent(req.query.state || CLIENT_ORIGIN);
                if (!code)
                    return [2 /*return*/, res.status(400).send("Missing code")];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                return [4 /*yield*/, (0, cross_fetch_1.default)("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            code: code,
                            client_id: GOOGLE_CLIENT_ID,
                            client_secret: GOOGLE_CLIENT_SECRET,
                            redirect_uri: GOOGLE_REDIRECT_URI,
                            grant_type: "authorization_code",
                        }),
                    })];
            case 2:
                tokenRes = _a.sent();
                if (!!tokenRes.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, tokenRes.text()];
            case 3:
                text = _a.sent();
                console.error("[oauth] token exchange failed:", text);
                return [2 /*return*/, res.status(500).send("OAuth token exchange failed")];
            case 4: return [4 /*yield*/, tokenRes.json()];
            case 5:
                tokens = _a.sent();
                payload = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
                GoogleUser = zod_1.z.object({
                    sub: zod_1.z.string(),
                    email: zod_1.z.string().email(),
                    name: zod_1.z.string().optional(),
                    picture: zod_1.z.string().url().optional(),
                });
                g = GoogleUser.parse(payload);
                return [4 /*yield*/, prisma.user.upsert({
                        where: { googleId: g.sub },
                        update: { email: g.email, name: g.name, picture: g.picture, lastLoginAt: new Date() },
                        create: { googleId: g.sub, email: g.email, name: g.name, picture: g.picture },
                    })];
            case 6:
                user = _a.sent();
                setSession(res, { uid: user.id });
                res.redirect(state || CLIENT_ORIGIN);
                return [3 /*break*/, 8];
            case 7:
                e_1 = _a.sent();
                console.error("[oauth] callback error:", e_1);
                res.status(500).send("OAuth error");
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// 현재 사용자
app.get("/api/me", requireUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var uid, me;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                uid = req.uid;
                return [4 /*yield*/, prisma.user.findUnique({ where: { id: uid } })];
            case 1:
                me = _a.sent();
                res.json({ id: me === null || me === void 0 ? void 0 : me.id, email: me === null || me === void 0 ? void 0 : me.email, name: me === null || me === void 0 ? void 0 : me.name, picture: me === null || me === void 0 ? void 0 : me.picture });
                return [2 /*return*/];
        }
    });
}); });
// 로그아웃
app.post("/api/logout", function (_req, res) {
    clearSession(res);
    res.json({ ok: true });
});
// 서버 시작 + 에러 핸들링
var server = app.listen(Number(PORT), "0.0.0.0", function () {
    console.log("Auth server on http://localhost:".concat(PORT));
});
server.on("error", function (err) {
    console.error("[listen] error:", err);
    process.exit(1);
});
// 예외 로깅
process.on("uncaughtException", function (e) { return console.error("[uncaughtException]", e); });
process.on("unhandledRejection", function (e) { return console.error("[unhandledRejection]", e); });
