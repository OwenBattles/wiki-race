#!/usr/bin/env node
//
// Boots a throwaway server on its own port, runs each suite against it, tears it down.
//
//   npm test              fast suites
//   npm run test:all      also runs eviction, which waits out real 30s timers (~80s)
//
// These are integration tests: they talk real Socket.IO and hit the live Wikipedia API, so
// they need network access and are timing-sensitive by nature.
const { spawn } = require('child_process');
const path = require('path');

const PORT = Number(process.env.TEST_PORT) || 3199;
const TEST_SERVER_URL = `http://localhost:${PORT}`;

const FAST_SUITES = ['gameplay.test.js', 'authority.test.js', 'reconnect.test.js'];
const SLOW_SUITES = ['eviction.test.js'];

const suites = process.argv.includes('--all') ? [...FAST_SUITES, ...SLOW_SUITES] : FAST_SUITES;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitForServer = async (timeoutMs = 20000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${TEST_SERVER_URL}/api/wiki/Cat`);
      if (res.ok) return true;
    } catch {
      // Not listening yet.
    }
    await sleep(300);
  }
  return false;
};

const runSuite = (file) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, file)], {
      stdio: 'inherit',
      env: { ...process.env, TEST_SERVER_URL },
    });
    child.on('exit', (code) => resolve(code === 0));
  });

(async () => {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'index.js')], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  let serverExited = false;
  server.on('exit', (code) => {
    serverExited = true;
    if (code !== 0 && code !== null) console.error(`\nServer exited unexpectedly with code ${code}`);
  });

  const shutdown = () => {
    if (!serverExited) server.kill();
  };
  process.on('exit', shutdown);
  process.on('SIGINT', () => { shutdown(); process.exit(130); });

  if (!(await waitForServer())) {
    console.error(`Server did not come up on ${TEST_SERVER_URL}. Is port ${PORT} free, and is the network reachable?`);
    shutdown();
    process.exit(1);
  }

  const failed = [];
  for (const suite of suites) {
    console.log(`\n──────── ${suite} ────────`);
    const ok = await runSuite(suite);
    if (!ok) failed.push(suite);
    // A suite dying should not be blamed on the next one.
    if (serverExited) {
      console.error('\nServer is no longer running — aborting remaining suites.');
      failed.push(...suites.slice(suites.indexOf(suite) + 1));
      break;
    }
  }

  shutdown();
  await sleep(200);

  console.log('\n════════════════════════════');
  if (failed.length === 0) {
    console.log(`All ${suites.length} suite(s) passed.`);
    process.exit(0);
  }
  console.log(`Failed: ${failed.join(', ')}`);
  process.exit(1);
})();
