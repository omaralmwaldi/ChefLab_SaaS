require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert");

const app = require("../src/app");
const prisma = require("../src/config/prisma");

// Boot the real Express app on an ephemeral port and drive it over HTTP so the
// test exercises the full POST /auth/signup seam (route -> controller ->
// service -> Prisma), asserting only on observable behavior.
let baseUrl;
let server;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

test("POST /auth/signup happy path creates an owned tenant and signs the owner in", async () => {
  const email = `owner+${Date.now()}@tracer.test`;
  const password = "Str0ng!Passw0rd";
  const body = {
    organizationName: "Tracer Café",
    name: "Tracer Owner",
    email,
    password,
    confirmPassword: password,
    preferredLanguage: "en",
  };

  let createdUserId;
  let createdOrgId;
  try {
    const res = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    assert.strictEqual(res.status, 201);

    const data = await res.json();
    assert.ok(data.token, "response includes a token");
    assert.ok(data.user, "response includes a user");
    assert.strictEqual(data.user.isOwner, true);
    assert.strictEqual(data.user.roleId, null);
    assert.strictEqual(data.user.email, email);

    createdUserId = data.user.id;
    createdOrgId = data.user.organizationId;

    // Integrity: the created organization is owned by the new user.
    const org = await prisma.organization.findUnique({
      where: { id: createdOrgId },
      select: { ownerUserId: true },
    });
    assert.strictEqual(org.ownerUserId, createdUserId);

    // The returned token authenticates against GET /auth/me.
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    assert.strictEqual(meRes.status, 200);
    const me = await meRes.json();
    assert.strictEqual(me.id, createdUserId);
    assert.strictEqual(me.isOwner, true);

    // The new owner can log in afterward with the same credentials.
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.user.id, createdUserId);
  } finally {
    // Teardown: remove the rows this test created (user first, org owns FK).
    if (createdOrgId) {
      await prisma.organization.update({
        where: { id: createdOrgId },
        data: { ownerUserId: null },
      });
    }
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    if (createdOrgId) {
      await prisma.organization.delete({ where: { id: createdOrgId } }).catch(() => {});
    }
  }
});
