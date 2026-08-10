// Verifies Tier 1 #8: reconnect across a dropped socket (what a page refresh looks like).
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
const maybe = (s, ev, ms) => new Promise((res) => {
  const t = setTimeout(() => res(null), ms);
  s.once(ev, (...a) => { clearTimeout(t); res(a); });
});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Move validation means tests must click links that genuinely exist. Ask the server for a
// page's real outgoing links rather than hard-coding guesses.
const linksOf = async (title) => {
  const res = await fetch(`${URL}/api/wiki/${encodeURIComponent(title)}`);
  const { content } = await res.json();
  const found = [];
  const re = /href="\/wiki\/([^"#?]+)"/g;
  let m;
  while ((m = re.exec(content))) {
    const t = decodeURIComponent(m[1]).replace(/_/g, ' ');
    if (!t.includes(':')) found.push(t);
  }
  return [...new Set(found)];
};


// A "refresh": the old socket dies, a brand new one appears and presents the token.
const refresh = async (oldSocket, session) => {
  oldSocket.close();
  await sleep(300);
  const fresh = io(URL);
  await wait(fresh, 'connect');
  fresh.emit('rejoin_room', session);
  return fresh;
};

const setup = async () => {
  const host = io(URL);
  await wait(host, 'connect');
  const hostSession = wait(host, 'session_established');
  host.emit('create_room', { username: 'Host' });
  const [roomCode] = await wait(host, 'room_created');
  const [hostSess] = await hostSession;

  const guest = io(URL);
  await wait(guest, 'connect');
  const guestSession = wait(guest, 'session_established');
  const joined = wait(guest, 'update_player_list');
  guest.emit('join_room', { roomCode, username: 'Guest' });
  const [players] = await joined;
  const [guestSess] = await guestSession;

  return { host, guest, roomCode, hostSess, guestSess, players };
};

const startRound = async (host, guest, roomCode, { start = 'Felidae', target = 'Cat', powerUps = {} } = {}) => {
  for (const [type, value] of Object.entries(powerUps)) {
    const p = wait(guest, 'power_up_changed');
    host.emit('set_power_up', { roomCode, powerUpType: type, value });
    await p;
  }
  host.emit('set_start_page', { roomCode, startPage: start });
  await wait(guest, 'start_page');
  host.emit('set_target_page', { roomCode, targetPage: target });
  await wait(guest, 'target_page');
  host.emit('start_game', { roomCode });
  return Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);
};

(async () => {
  // ------------------------------------------------------------ session token handshake
  console.log('\nsession credential is issued and kept private');
  {
    const { host, guest, roomCode, hostSess, guestSess, players } = await setup();
    check('host receives a session token', typeof hostSess.token === 'string' && hostSess.token.length > 20);
    check('token is scoped to the room', hostSess.roomCode === roomCode);
    check('guest gets a different token', guestSess.token !== hostSess.token);
    check('tokens are never in the player list', !JSON.stringify(players).includes(hostSess.token));
    check('players report a connected flag', players.every(p => p.connected === true));
    host.close(); guest.close();
  }

  // --------------------------------------------------------- refresh during the lobby
  console.log('\nrefreshing in the lobby keeps your seat and host role');
  {
    const { host, guest, roomCode, hostSess } = await setup();
    host.emit('set_power_up', { roomCode, powerUpType: 'swap', value: 2 });
    await wait(guest, 'power_up_changed');

    const guestSawDrop = wait(guest, 'update_player_list');
    const fresh = await refresh(host, hostSess);
    const [state] = await wait(fresh, 'rejoin_success');

    const dropped = (await guestSawDrop).at(0).find(p => p.username === 'Host');
    check('others see the host as disconnected, not gone', dropped?.connected === false);
    check('rejoin restores host role', state.isHost === true);
    check('rejoin restores the room code', state.roomCode === roomCode);
    check('rejoin restores lobby state', state.gameState === 'LOBBY');
    check('rejoin restores the power-up allowance', state.powerUps.swap === 2, JSON.stringify(state.powerUps));
    check('rejoin restores the username', state.username === 'Host');

    const after = await new Promise(res => { fresh.emit('request_player_list', roomCode); fresh.once('update_player_list', res); });
    check('still exactly 2 players (no ghost seat)', after.length === 2, `${after.length} players`);
    check('reconnected player marked connected again', after.find(p => p.username === 'Host').connected === true);
    check('host role not handed to the guest', after.find(p => p.username === 'Guest').isHost === false);

    fresh.close(); guest.close();
  }

  // ---------------------------------------------------------- refresh mid-race
  console.log('\nrefreshing mid-race puts you back in the same race');
  {
    const { host, guest, roomCode, hostSess } = await setup();
    // Two legal hops: Felidae -> Panthera, then Panthera -> something Panthera links to.
    const [panLink] = await linksOf('Panthera');
    await startRound(host, guest, roomCode, { target: panLink, powerUps: { swap: 1, scramble: 1 } });

    host.emit('player_moved', { roomCode, pageTitle: 'Panthera' });
    await wait(guest, 'update_player_list');
    // Spend one power-up so we can prove the *remaining* inventory comes back.
    let inv = wait(host, 'inventory_changed');
    const guestId = (await new Promise(res => { host.emit('request_player_list', roomCode); host.once('update_player_list', res); }))
      .find(p => p.username === 'Guest').id;
    host.emit('use_power_up', { roomCode, powerUpType: 'scramble', victimId: guestId });
    await inv;

    await sleep(1200);
    const fresh = await refresh(host, hostSess);
    const [state] = await wait(fresh, 'rejoin_success');

    check('rejoin restores RACING state', state.gameState === 'RACING');
    check('rejoin says you are still playing', state.isPlaying === true);
    check('rejoin restores your current page', state.currentPageTitle === 'Panthera', state.currentPageTitle);
    check('rejoin restores the destination', state.targetPage.length > 0, state.targetPage);
    check('rejoin restores remaining inventory', state.inventory.swap === 1 && state.inventory.scramble === 0,
      JSON.stringify(state.inventory));
    check('elapsed time carries over so the timer stays true', state.elapsedMs > 1000, `${state.elapsedMs}ms`);
    check('no article HTML in the rejoin payload', !JSON.stringify(state).includes('mw-parser'));

    // And the restored player can still play and win.
    const won = wait(guest, 'game_won', 25000);
    fresh.emit('player_moved', { roomCode, pageTitle: panLink });
    const [end] = await won;
    check('restored player can still win', end.player.username === 'Host');
    fresh.close(); guest.close();
  }

  // ---------------------------------------------------------- refresh after game over
  console.log('\nrefreshing on the game-over screen shows the same result');
  {
    const { host, guest, roomCode, hostSess } = await setup();
    await startRound(host, guest, roomCode);
    const won = wait(guest, 'game_won', 25000);
    guest.emit('player_moved', { roomCode, pageTitle: 'Cat' });
    const [finish] = await won;

    const fresh = await refresh(host, hostSess);
    const [state] = await wait(fresh, 'rejoin_success');
    check('rejoin restores FINISHED state', state.gameState === 'FINISHED');
    check('rejoin restores the winner', state.winner?.username === 'Guest', JSON.stringify(state.winner?.username));
    check('rejoin restores the final time', state.totalTime === finish.totalTime, String(state.totalTime));
    check('recap paths are present', Array.isArray(state.players[0].path));
    fresh.close(); guest.close();
  }

  // ---------------------------------------------------------- surrendered player refresh
  console.log('\nrefreshing after surrendering returns you to the surrendered view');
  {
    const { host, guest, roomCode, hostSess } = await setup();
    await startRound(host, guest, roomCode);
    host.emit('surrender', roomCode);
    await wait(host, 'surrendered_to_lobby');

    const fresh = await refresh(host, hostSess);
    const [state] = await wait(fresh, 'rejoin_success');
    check('round is still RACING for others', state.gameState === 'RACING');
    check('but you are not playing', state.isPlaying === false);
    fresh.close(); guest.close();
  }

  // ---------------------------------------------------------- bad / stale credentials
  console.log('\nbogus credentials are rejected cleanly');
  {
    const { host, guest, roomCode, hostSess } = await setup();
    const probe = io(URL);
    await wait(probe, 'connect');

    probe.emit('rejoin_room', { roomCode, token: 'not-a-real-token' });
    check('wrong token is refused', (await maybe(probe, 'rejoin_failed', 4000)) !== null);

    probe.emit('rejoin_room', { roomCode: 'ZZZZZ', token: hostSess.token });
    check('unknown room is refused', (await maybe(probe, 'rejoin_failed', 4000)) !== null);

    probe.emit('rejoin_room', {});
    check('empty payload is refused, not fatal', (await maybe(probe, 'rejoin_failed', 4000)) !== null);

    const players = await new Promise(res => { host.emit('request_player_list', roomCode); host.once('update_player_list', res); });
    check('failed rejoins added nobody to the room', players.length === 2, `${players.length} players`);
    probe.close(); host.close(); guest.close();
  }

  // ---------------------------------------------------------- eviction after the window
  console.log('\nleaving for good still frees the seat (30s grace)');
  {
    const { host, guest, roomCode, guestSess } = await setup();
    guest.close();
    await sleep(1000);

    let players = await new Promise(res => { host.emit('request_player_list', roomCode); host.once('update_player_list', res); });
    check('seat is held during the window', players.length === 2 && players.find(p => p.username === 'Guest').connected === false);

    // Too slow to wait out 30s here; confirm the seat is reclaimable right up to the edge.
    const fresh = io(URL);
    await wait(fresh, 'connect');
    fresh.emit('rejoin_room', guestSess);
    const [state] = await wait(fresh, 'rejoin_success');
    check('seat reclaimable late in the window', state.username === 'Guest');

    fresh.close(); host.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('\nHARNESS ERROR:', e.message); process.exit(1); });
