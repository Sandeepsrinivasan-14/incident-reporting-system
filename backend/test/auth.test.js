import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createAuth, resolveJwtSecret } from "../lib/auth.js";

const SECRET = "unit-test-secret";
const { signToken, authMiddleware, requireResolver } = createAuth(SECRET);

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("resolveJwtSecret uses JWT_SECRET when set", () => {
  assert.equal(resolveJwtSecret({ JWT_SECRET: "abc", NODE_ENV: "production" }), "abc");
});

test("resolveJwtSecret refuses to start in production without a secret", () => {
  assert.throws(() => resolveJwtSecret({ NODE_ENV: "production" }), /JWT_SECRET must be set/);
});

test("resolveJwtSecret keeps a dev fallback outside production", () => {
  assert.ok(resolveJwtSecret({ NODE_ENV: "development" }));
  assert.ok(resolveJwtSecret({}));
});

test("signToken embeds id, email and role", () => {
  const payload = jwt.verify(signToken({ id: 7, email: "a@b.co", role: "RESOLVER" }), SECRET);
  assert.deepEqual({ id: payload.id, email: payload.email, role: payload.role }, { id: 7, email: "a@b.co", role: "RESOLVER" });
});

test("authMiddleware rejects a missing header", () => {
  const res = mockRes();
  let called = false;
  authMiddleware({ headers: {} }, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test("authMiddleware rejects a token signed with another secret", () => {
  const forged = jwt.sign({ id: 1, role: "RESOLVER" }, "someone-elses-secret");
  const res = mockRes();
  let called = false;
  authMiddleware({ headers: { authorization: `Bearer ${forged}` } }, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test("authMiddleware accepts a valid token and sets req.user", () => {
  const token = signToken({ id: 3, email: "x@y.z", role: "REPORTER" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let called = false;
  authMiddleware(req, mockRes(), () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.user.id, 3);
});

test("requireResolver allows RESOLVER and blocks everyone else", () => {
  let ok = false;
  requireResolver({ user: { role: "RESOLVER" } }, mockRes(), () => { ok = true; });
  assert.equal(ok, true);

  const res = mockRes();
  let blocked = true;
  requireResolver({ user: { role: "REPORTER" } }, res, () => { blocked = false; });
  assert.equal(res.statusCode, 403);
  assert.equal(blocked, true);
});
