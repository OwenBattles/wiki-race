// Verifies each Tier 1 fix against a locally running server.
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


const newRoom = async (hostName = 'Host') => {
  const host = io(URL);
  await wait(host, 'connect');
  host.emit('create_room', { username: hostName });
  const [roomCode] = await wait(host, 'room_created');
  return { host, roomCode };
};
const addGuest = async (roomCode, name) => {
  const guest = io(URL);
  await wait(guest, 'connect');
  const joined = wait(guest, 'update_player_list');
  guest.emit('join_room', { roomCode, username: name });
  const [players] = await joined;
  return { guest, players };
};
const configure = async (host, guest, roomCode, { start, target, powerUps = {} }) => {
  for (const [type, value] of Object.entries(powerUps)) {
    const p = wait(guest, 'power_up_changed');
    host.emit('set_power_up', { roomCode, powerUpType: type, value });
    await p;
  }
  host.emit('set_start_page', { roomCode, startPage: start });
  await wait(guest, 'start_page');
  host.emit('set_target_page', { roomCode, targetPage: target });
  await wait(guest, 'target_page');
};

(async () => {
  // ---------------------------------------------------------------- #6 room code length
  console.log('\n#6 room code is always exactly 5 chars from a safe alphabet');
  {
    const codes = [];
    const socks = [];
    for (let i = 0; i < 40; i++) {
      const { host, roomCode } = await newRoom(`H${i}`);
      codes.push(roomCode); socks.push(host);
    }
    const badLength = codes.filter(c => c.length !== 5);
    const badChars = codes.filter(c => !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/.test(c));
    check('40/40 codes are 5 chars', badLength.length === 0, badLength.length ? `bad: ${badLength}` : `e.g. ${codes[0]}`);
    check('no ambiguous glyphs (I/O/0/1)', badChars.length === 0);
    check('no duplicates', new Set(codes).size === codes.length);
    socks.forEach(s => s.close());
  }

  // ------------------------------------------------------- #1 per-player power-up budget
  console.log('\n#1 power-ups are per-player and cannot go negative');
  {
    const { host, roomCode } = await newRoom();
    const { guest, players } = await addGuest(roomCode, 'Guest');
    const guestId = players.find(p => p.username === 'Guest').id;
    const hostId = players.find(p => p.username === 'Host').id;
    await configure(host, guest, roomCode, { start: 'Cat', target: 'Dog', powerUps: { swap: 1 } });

    host.emit('start_game', { roomCode });
    const [[hostStart], [guestStart]] = await Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);
    check('game_started carries a starting inventory', hostStart.inventory?.swap === 1, JSON.stringify(hostStart.inventory));
    check('both players start with swap = 1', guestStart.inventory?.swap === 1);

    let inv = wait(host, 'inventory_changed');
    host.emit('use_power_up', { roomCode, powerUpType: 'swap', victimId: guestId });
    check('host spend takes host 1 -> 0', (await inv)[0].swap === 0);

    inv = wait(guest, 'inventory_changed');
    guest.emit('use_power_up', { roomCode, powerUpType: 'swap', victimId: hostId });
    check('guest still had its own swap (1 -> 0)', (await inv)[0].swap === 0);

    const noMore = await maybe(guest, 'inventory_changed', 2500);
    check('spending with 0 left is ignored (no event, no negative)', noMore === null, noMore ? JSON.stringify(noMore[0]) : 'silently dropped');

    // Round ends; host's configured allowance must be intact for the next round.
    const back = wait(guest, 'return_to_lobby');
    host.emit('navigate_to_lobby', roomCode);
    const [lobbyPowerUps] = await back;
    check('#1b host allowance survives the round (swap still 1)', lobbyPowerUps.swap === 1, JSON.stringify(lobbyPowerUps));

    host.close(); guest.close();
  }

  // ------------------------------------------------------------- #3 broadcast payload size
  console.log('\n#3 move broadcasts no longer carry article HTML');
  {
    const { host, roomCode } = await newRoom();
    const { guest } = await addGuest(roomCode, 'Guest');
    await configure(host, guest, roomCode, { start: 'Cat', target: 'Dog' });
    host.emit('start_game', { roomCode });
    await Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);

    const [realLink] = await linksOf('Cat');
    const size = new Promise(res => guest.once('update_player_list', ps => res(JSON.stringify(ps))));
    host.emit('player_moved', { roomCode, pageTitle: realLink });
    const payload = await size;
    const kb = payload.length / 1024;
    check('payload is under 1 KB (was 1142 KB)', kb < 1, `${kb.toFixed(2)} KB`);
    check('no html leaked into the payload', !payload.includes('<div') && !payload.includes('mw-parser'));
    check('#3b opponent positions hidden mid-race', !payload.includes(realLink), 'no path/currentPageTitle during RACING');

    host.close(); guest.close();
  }

  // ------------------------------------------------------------------- #2 redirect wins
  console.log('\n#2 reaching the target through a redirect counts as a win');
  {
    const { host, roomCode } = await newRoom();
    const { guest } = await addGuest(roomCode, 'Guest');
    // "Dogs" redirects to "Dog", and "Cat" genuinely links to "Dog" — so the racer reaches
    // the target through a link whose title differs from the one the host typed.
    await configure(host, guest, roomCode, { start: 'Cat', target: 'Dogs' });
    host.emit('start_game', { roomCode });
    const [[started]] = await Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);
    check('target resolved to canonical form at start', started.targetPage === 'Dog', `targetPage = "${started.targetPage}"`);

    const won = wait(guest, 'game_won');
    host.emit('player_moved', { roomCode, pageTitle: 'Dog' });
    const [payload] = await won;
    check('arriving at "Dog" via the redirect target wins', payload.player.username === 'Host');
    check('winner path is included at game over', Array.isArray(payload.player.path) && payload.player.path.length === 2);

    host.close(); guest.close();
  }
  // Case/underscore variants must also match.
  {
    const { host, roomCode } = await newRoom();
    const { guest } = await addGuest(roomCode, 'Guest');
    await configure(host, guest, roomCode, { start: 'Cat', target: 'Dog' });
    host.emit('start_game', { roomCode });
    await Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);
    const won = wait(guest, 'game_won');
    host.emit('player_moved', { roomCode, pageTitle: 'dog' });
    const got = await Promise.race([won.then(() => true), new Promise(r => setTimeout(() => r(false), 4000))]);
    check('title comparison ignores case', got === true);
    host.close(); guest.close();
  }

  // ----------------------------------------------------------------- #7 double-win race
  console.log('\n#7 only the first player across the line wins');
  {
    const { host, roomCode } = await newRoom();
    const { guest } = await addGuest(roomCode, 'Guest');
    await configure(host, guest, roomCode, { start: 'Cat', target: 'Dog' });
    host.emit('start_game', { roomCode });
    await Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);

    const winners = [];
    guest.on('game_won', ({ player }) => winners.push(player.username));
    host.emit('player_moved', { roomCode, pageTitle: 'Dog' });
    guest.emit('player_moved', { roomCode, pageTitle: 'Dog' });
    await new Promise(r => setTimeout(r, 3000));
    check('exactly one game_won emitted', winners.length === 1, `winners: [${winners}]`);
    check('the winner is the first mover', winners[0] === 'Host');
    host.close(); guest.close();
  }

  // ------------------------------------------------------- #4 mid-game join isolation
  console.log('\n#4 a mid-game joiner does not reset the racers');
  {
    const { host, roomCode } = await newRoom();
    const { guest } = await addGuest(roomCode, 'Guest');
    await configure(host, guest, roomCode, { start: 'Cat', target: 'Dog', powerUps: { swap: 2 } });
    host.emit('start_game', { roomCode });
    await Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);

    const hostSawJoinedRoom = maybe(host, 'joined_room', 3000);
    const hostSawPowerUpReset = maybe(host, 'power_up_changed', 3000);
    const { guest: latecomer } = await addGuest(roomCode, 'Latecomer');
    check('racers receive no joined_room', (await hostSawJoinedRoom) === null);
    check('racers receive no power-up reset', (await hostSawPowerUpReset) === null);

    // The latecomer isn't racing, so cannot be targeted.
    const invAfter = maybe(host, 'inventory_changed', 3000);
    const [players] = [await new Promise(res => { host.emit('request_player_list', roomCode); host.once('update_player_list', res); })];
    const lateId = players.find(p => p.username === 'Latecomer').id;
    check('latecomer is not marked as playing', players.find(p => p.username === 'Latecomer').isPlaying === false);
    host.emit('use_power_up', { roomCode, powerUpType: 'swap', victimId: lateId });
    check('power-up on a non-racer is rejected (not charged)', (await invAfter) === null);

    host.close(); guest.close(); latecomer.close();
  }

  // ----------------------------------------------------- #9 surrender preserves the path
  console.log('\n#9 surrendering keeps your path for the recap');
  {
    const { host, roomCode } = await newRoom();
    const { guest } = await addGuest(roomCode, 'Guest');
    await configure(host, guest, roomCode, { start: 'Cat', target: 'Dog' });
    host.emit('start_game', { roomCode });
    await Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);

    const [catLink] = await linksOf('Cat');
    host.emit('player_moved', { roomCode, pageTitle: catLink });
    await wait(guest, 'update_player_list');

    const list = wait(guest, 'update_player_list');
    host.emit('surrender', roomCode);
    await wait(host, 'surrendered_to_lobby');
    const [midRacePlayers] = await list;
    const hostRow = midRacePlayers.find(p => p.username === 'Host');
    check('surrendered player is no longer racing', hostRow.isPlaying === false);
    check('paths still withheld while others race', hostRow.path === undefined);

    // Last racer surrenders -> round ends with nobody winning, and now the recap data
    // arrives. The surrendered player's route must still be there.
    const won = wait(guest, 'game_won');
    const finalList = wait(guest, 'update_player_list');
    guest.emit('surrender', roomCode);
    const [end] = await won;
    check('round ends when the last racer surrenders', end.player.username === 'Nobody');

    const [finalPlayers] = await finalList;
    const hostFinal = finalPlayers.find(p => p.username === 'Host');
    check('surrendered player keeps a 2-page path in the recap', hostFinal.path?.length === 2,
      JSON.stringify(hostFinal.path?.map(x => x.title)));
    host.close(); guest.close();
  }

  // --------------------------------------------------- #5 bad input cannot kill the server
  console.log('\n#5 malformed / unknown input is survived, not fatal');
  {
    const probe = io(URL);
    await wait(probe, 'connect');
    // Every one of these used to be a TypeError on rooms[undefined] or an unhandled throw.
    probe.emit('set_start_page', { roomCode: 'NOPE', startPage: 'Cat' });
    probe.emit('set_target_page', { roomCode: 'NOPE', targetPage: 'Dog' });
    probe.emit('set_power_up', { roomCode: 'NOPE', powerUpType: 'swap', value: 1 });
    probe.emit('set_power_up', {});
    probe.emit('start_game', { roomCode: 'NOPE' });
    probe.emit('player_moved', { roomCode: 'NOPE', pageTitle: 'Cat' });
    probe.emit('use_power_up', { roomCode: 'NOPE', powerUpType: 'swap', victimId: 'x' });
    probe.emit('navigate_to_lobby', 'NOPE');
    probe.emit('surrender', 'NOPE');
    probe.emit('create_room', {});
    probe.emit('join_room', {});
    probe.emit('set_power_up', { roomCode: 'NOPE', powerUpType: '__proto__', value: 5 });
    await new Promise(r => setTimeout(r, 2000));

    // A non-existent target page must fail cleanly rather than crash the process.
    const { host, roomCode } = await newRoom();
    const { guest } = await addGuest(roomCode, 'Guest');
    await configure(host, guest, roomCode, {
      start: 'Zzzznotarealwikipediapage12345', target: 'Dog',
    });
    const err = wait(host, 'error', 20000);
    host.emit('start_game', { roomCode });
    const [msg] = await err;
    check('unresolvable start page returns an error event', typeof msg === 'string', msg);

    // Server must still be answering.
    const after = io(URL);
    await wait(after, 'connect');
    after.emit('create_room', { username: 'StillAlive' });
    const [code] = await wait(after, 'room_created');
    check('server still alive and issuing rooms', typeof code === 'string' && code.length === 5, code);
    probe.close(); host.close(); guest.close(); after.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('\nHARNESS ERROR:', e.message); process.exit(1); });
