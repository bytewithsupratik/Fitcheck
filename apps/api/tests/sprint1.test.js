import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  // Start server on a random free port for testing
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("Sprint 1: Core Foundation & Auth Tests", () => {
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: "Password123!",
  };
  let authToken = "";

  test("1. Health Endpoint returns 200 and Request-Id", async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.status, "ok");
    assert.equal(data.database, "connected");
    assert.ok(res.headers.get("x-request-id"));
  });

  test("2. Unauthenticated Profile Request returns 401 with standard error envelope", async () => {
    const res = await fetch(`${baseUrl}/user/profile`);
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.error.code, "UNAUTHORIZED");
    assert.ok(data.error.requestId);
    assert.ok(data.message);
  });

  test("3. Register new user successfully (creates user + learner)", async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.equal(data.user.email, testUser.email);
    assert.ok(data.user.id);
  });

  test("4. Duplicate registration returns 409 Conflict", async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();

    assert.equal(res.status, 409);
    assert.equal(data.error.code, "CONFLICT");
  });

  test("5. Login returns JWT Token", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.ok(data.token);
    assert.equal(data.user.email, testUser.email);
    authToken = data.token;
  });

  test("6. Access Profile with valid token returns user + learner data", async () => {
    const res = await fetch(`${baseUrl}/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.profile.email, testUser.email);
    assert.ok(data.profile.learner);
    assert.equal(data.profile.learner.id, data.profile.id);
  });

  test("7. Access Profile with invalid token returns 401", async () => {
    const res = await fetch(`${baseUrl}/user/profile`, {
      headers: { Authorization: "Bearer bad_invalid_token" },
    });
    const data = await res.json();

    assert.equal(res.status, 401);
    assert.equal(data.error.code, "UNAUTHORIZED");
  });
});




