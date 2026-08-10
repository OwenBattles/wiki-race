// Leaving on purpose must free the seat and the name immediately, not hold them for the
// reconnect window the way a disconnect does.
const { io } = require('socket.io-client');
const URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
let pass = 0, fail = 0;
const check = (l, ok, d='') => { console.log(`${ok?'  PASS':'  FAIL'}  ${l}${d?` — ${d}`:''}`); ok?pass++:fail++; };
const wait = (s, ev, ms=15000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('timeout on '+ev)), ms);
  s.once(ev, (...a) => { clearTimeout(t); res(a); });
});
const list = (s, rc) => new Promise(r => { s.emit('request_player_list', rc); s.once('update_player_list', r); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Player-list broadcasts arrive for every room change, so waiting for "the next one" can
// catch an unrelated update. Wait for one that actually matches what we're asserting.
const waitForList = (s, pred, ms=15000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('timeout waiting for a matching player list')), ms);
  const handler = (players) => {
    if (!pred(players)) return;
    clearTimeout(t); s.off('update_player_list', handler); res(players);
  };
  s.on('update_player_list', handler);
});

(async () => {
  const host = io(URL); await wait(host, 'connect');
  host.emit('create_room', { username: 'Host' });
  const [roomCode] = await wait(host, 'room_created');

  const guest = io(URL); await wait(guest, 'connect');
  const joined = wait(guest, 'update_player_list');
  guest.emit('join_room', { roomCode, username: 'Guest' });
  await joined;

  const sawLeave = waitForList(host, ps => ps.length === 1);
  guest.emit('leave_room', roomCode);
  const after = await sawLeave;
  check('leaving removes the player at once', after.length === 1, `${after.length} players`);
  check('no seat held for reconnect', !after.some(p => p.connected === false));

  // The freed name is immediately reusable — unlike after a disconnect.
  const other = io(URL); await wait(other, 'connect');
  const rejoined = wait(other, 'session_established');
  other.emit('join_room', { roomCode, username: 'Guest' });
  await rejoined;
  check('the freed name can be taken straight away', true);

  // Host leaving hands the room over rather than stranding it.
  const promoted = waitForList(other, ps => ps.length === 1);
  host.emit('leave_room', roomCode);
  const players = await promoted;
  check('remaining player is promoted to host', players.length === 1 && players[0].isHost === true,
    JSON.stringify(players.map(p => [p.username, p.isHost])));

  // Last player out deletes the room.
  other.emit('leave_room', roomCode);
  await sleep(500);
  const probe = io(URL); await wait(probe, 'connect');
  probe.emit('find_room', roomCode);
  const [found] = await wait(probe, 'found_room');
  check('empty room is deleted', found === false);

  // Leaving a room you are not in must not throw.
  probe.emit('leave_room', 'ZZZZZ');
  probe.emit('leave_room', roomCode);
  await sleep(400);
  probe.emit('create_room', { username: 'Alive' });
  const [code] = await wait(probe, 'room_created');
  check('server survives bogus leave_room', typeof code === 'string' && code.length === 5);

  host.close(); guest.close(); other.close(); probe.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('HARNESS ERROR:', e.message); process.exit(1); });
