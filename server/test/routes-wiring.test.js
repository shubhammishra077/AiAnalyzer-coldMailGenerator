// Express isn't installed in every environment these tests run in, so this guards the
// route wiring at the source level: protect + requireVerified must be registered
// BEFORE any resume route handler.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

describe('route wiring', () => {
  it('resume routes require login AND a verified email before any handler', () => {
    const src = read('routes/resumeRoutes.js');
    const guard = src.indexOf('router.use(protect, requireVerified)');
    const firstRoute = src.search(/router\.(get|post|put|delete)\(/);
    assert.ok(guard !== -1, 'guard middleware missing');
    assert.ok(guard < firstRoute, 'guard must be registered before routes');
  });

  it('AI generation, history and stats are behind protect', () => {
    assert.match(read('routes/aiRoutes.js'), /generate-email', protect/);
    assert.match(read('routes/aiRoutes.js'), /history', protect/);
    assert.match(read('routes/statsRoutes.js'), /'\/', protect/);
  });

  it('account deletion requires login and is rate limited', () => {
    const src = read('routes/accountRoutes.js');
    assert.match(src, /router\.delete\('\/', protect, accountLimiter/);
  });

  it('tracking updates require login', () => {
    assert.match(read('routes/aiRoutes.js'), /patch\('\/history\/:id\/tracking', protect/);
  });

  it('billing routes are protected and webhook is mounted before JSON parsing', () => {
    const routes = read('routes/billingRoutes.js');
    assert.match(routes, /router\.use\(protect\)/);
    assert.match(routes, /router\.post\('\/subscription'/);
    assert.match(routes, /router\.post\('\/verify'/);
    assert.match(routes, /router\.post\('\/cancel'/);
    const server = read('server.js');
    assert.ok(server.indexOf("app.post('/api/billing/webhook'") < server.indexOf('app.use(express.json'));
    assert.match(server, /app\.use\('\/api\/billing', billingRoutes\)/);
  });

  it('server mounts the new route groups', () => {
    const src = read('server.js');
    assert.match(src, /app\.use\('\/api\/resume'/);
    assert.match(src, /app\.use\('\/api\/stats'/);
    assert.match(src, /app\.use\('\/api\/account'/);
  });
});
