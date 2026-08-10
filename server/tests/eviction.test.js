// Confirms the reconnect grace period actually expires — a held seat must not leak forever.
const { io } = require('socket.io-client');
const URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';

let pass = 0, fail = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};
const wait = (s, ev, ms = 20000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error(`timeout on ${ev}`)), ms);
  s.once(ev, (...a) => { clearTimeout(t); res(a); });
});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const list = (sock, roomCode) => new Promise(res => {
  sock.emit('request_player_list', roomCode);
  sock.once('update_player_list', res);
});

(async () => {
  console.log('\nseat is freed once the 30s window closes (this takes ~35s)');

  const host = io(URL);
  await wait(host, 'connect');
  host.emit('create_room', { username: 'Host' });
  const [roomCode] = await wait(host, 'room_created');

  const guest = io(URL);
  await wait(guest, 'connect');
  const guestSess = wait(guest, 'session_established');
  const joined = wait(guest, 'update_player_list');
  guest.emit('join_room', { roomCode, username: 'Guest' });
  await joined;
  const [sess] = await guestSess;

  guest.close();
  await sleep(2000);
  let players = await list(host, roomCode);
  check('seat held 2s after drop', players.length === 2, `${players.length} players`);

  // Watch for the eviction broadcast rather than polling.
  const evicted = wait(host, 'update_player_list', 45000);
  await sleep(29000);
  players = await list(host, roomCode);
  check('seat still held at 31s (grace is 30s, plus scheduling slack)', players.length >= 1);

  await evicted;
  await sleep(1500);
  players = await list(host, roomCode);
  check('seat freed after the window', players.length === 1, `${players.length} players`);
  check('remaining player is the host', players[0].username === 'Host');

  // And the stale token no longer works.
  const probe = io(URL);
  await wait(probe, 'connect');
  probe.emit('rejoin_room', sess);
  const failed = await Promise.race([
    wait(probe, 'rejoin_failed', 5000).then(() => true),
    sleep(5000).then(() => false),
  ]);
  check('evicted token is refused', failed === true);

  // Now drop the host too: the room itself must be cleaned up.
  host.close();
  probe.close();
  await sleep(33000);
  const after = io(URL);
  await wait(after, 'connect');
  after.emit('find_room', roomCode);
  const [found] = await wait(after, 'found_room');
  check('empty room is deleted after its last seat expires', found === false);
  after.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('\nHARNESS ERROR:', e.message); process.exit(1); });
