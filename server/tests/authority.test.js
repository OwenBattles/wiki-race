// Verifies Tier 2: move validation, server-owned clock, host authorization, caching.
const { io } = require('socket.io-client');
const URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';

let pass = 0, fail = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};
const wait = (s, ev, ms = 25000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error(`timeout on ${ev}`)), ms);
  s.once(ev, (...a) => { clearTimeout(t); res(a); });
});
const maybe = (s, ev, ms) => new Promise((res) => {
  const t = setTimeout(() => res(null), ms);
  s.once(ev, (...a) => { clearTimeout(t); res(a); });
});
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const listOf = (sock, roomCode) => new Promise(res => {
  sock.emit('request_player_list', roomCode);
  sock.once('update_player_list', res);
});

const setup = async () => {
  const host = io(URL);
  await wait(host, 'connect');
  host.emit('create_room', { username: 'Host' });
  const [roomCode] = await wait(host, 'room_created');
  const guest = io(URL);
  await wait(guest, 'connect');
  const joined = wait(guest, 'update_player_list');
  guest.emit('join_room', { roomCode, username: 'Guest' });
  await joined;
  return { host, guest, roomCode };
};

const startRound = async (host, guest, roomCode, { start = 'Felidae', target = 'Dog' } = {}) => {
  host.emit('set_start_page', { roomCode, startPage: start });
  await wait(guest, 'start_page');
  host.emit('set_target_page', { roomCode, targetPage: target });
  await wait(guest, 'target_page');
  host.emit('start_game', { roomCode });
  return Promise.all([wait(host, 'game_started'), wait(guest, 'game_started')]);
};

(async () => {
  // -------------------------------------------------------------- move validation
  console.log('\nmoves must follow a link that really exists on your page');
  {
    const { host, guest, roomCode } = await setup();
    await startRound(host, guest, roomCode, { start: 'Felidae', target: 'Dog' });

    // The old exploit: jump straight to the target and win instantly.
    const cheated = maybe(guest, 'game_won', 6000);
    const rejected = wait(host, 'move_rejected', 15000);
    host.emit('player_moved', { roomCode, pageTitle: 'Dog' });
    const [rej] = await rejected;
    check('teleporting straight to the target is refused', rej.attemptedTitle === 'Dog');
    check('rejection says where you actually are', rej.currentPageTitle === 'Felidae', rej.currentPageTitle);
    check('no win was awarded', (await cheated) === null);

    // An unrelated page is refused too.
    const rejected2 = wait(host, 'move_rejected', 15000);
    host.emit('player_moved', { roomCode, pageTitle: 'Barack Obama' });
    check('an unlinked page is refused', (await rejected2)[0].attemptedTitle === 'Barack Obama');

    // A genuine link from Felidae is accepted.
    const moved = wait(guest, 'update_player_list', 15000);
    const noReject = maybe(host, 'move_rejected', 6000);
    host.emit('player_moved', { roomCode, pageTitle: 'Panthera' });
    await moved;
    check('a real link is accepted', (await noReject) === null);

    // Underscored href form, as it appears in real article markup.
    const noReject2 = maybe(host, 'move_rejected', 6000);
    const moved2 = wait(guest, 'update_player_list', 15000);
    host.emit('player_moved', { roomCode, pageTitle: 'Snow_leopard' });
    await moved2;
    check('underscored link form is accepted', (await noReject2) === null);

    host.close(); guest.close();
  }

  // ------------------------------------------------------- redirect links still work
  console.log('\nlinks that are redirects still resolve and can win');
  {
    const { host, guest, roomCode } = await setup();
    // "Cat" links to "Domestic cat"? Use a known redirect present on Felidae: "Cats" is not
    // linked, so instead target the canonical page reached through a linked redirect.
    await startRound(host, guest, roomCode, { start: 'Felidae', target: 'Cat' });
    const won = wait(guest, 'game_won', 20000);
    host.emit('player_moved', { roomCode, pageTitle: 'Cat' });
    const [end] = await won;
    check('clicking the target link wins', end.player.username === 'Host');
    check('server timed the round itself', end.totalTime > 0 && end.totalTime < 60000, `${end.totalTime}ms`);
    host.close(); guest.close();
  }

  // ------------------------------------------------------------- server-owned clock
  console.log('\nthe clock belongs to the server');
  {
    const { host, guest, roomCode } = await setup();
    await startRound(host, guest, roomCode, { start: 'Felidae', target: 'Panthera' });
    await sleep(2500);

    const won = wait(guest, 'game_won', 20000);
    // Claim an absurd time; the server should ignore it entirely.
    host.emit('player_moved', { roomCode, pageTitle: 'Panthera', elapsedTime: 1 });
    const [end] = await won;
    check('client-claimed elapsedTime is ignored', end.totalTime > 2000, `${end.totalTime}ms (claimed 1ms)`);
    host.close(); guest.close();
  }

  // ------------------------------------------------------------- host authorization
  console.log('\nlobby configuration is host-only');
  {
    const { host, guest, roomCode } = await setup();

    const hostSawStart = maybe(host, 'start_page', 3000);
    guest.emit('set_start_page', { roomCode, startPage: 'Barack Obama' });
    check('non-host cannot set the start page', (await hostSawStart) === null);

    const hostSawTarget = maybe(host, 'target_page', 3000);
    guest.emit('set_target_page', { roomCode, targetPage: 'Barack Obama' });
    check('non-host cannot set the target page', (await hostSawTarget) === null);

    const hostSawPowerUp = maybe(host, 'power_up_changed', 3000);
    guest.emit('set_power_up', { roomCode, powerUpType: 'swap', value: 9 });
    check('non-host cannot change power-up settings', (await hostSawPowerUp) === null);

    // Host can, and then a non-host cannot start or reset the round.
    host.emit('set_start_page', { roomCode, startPage: 'Felidae' });
    await wait(guest, 'start_page');
    host.emit('set_target_page', { roomCode, targetPage: 'Dog' });
    await wait(guest, 'target_page');

    const guestStarted = maybe(guest, 'game_started', 6000);
    guest.emit('start_game', { roomCode });
    check('non-host cannot start the game', (await guestStarted) === null);

    await startRound(host, guest, roomCode, { start: 'Felidae', target: 'Dog' });
    const guestReset = maybe(guest, 'return_to_lobby', 4000);
    guest.emit('navigate_to_lobby', roomCode);
    check('non-host cannot send everyone back to the lobby', (await guestReset) === null);

    const hostReset = wait(guest, 'return_to_lobby', 8000);
    host.emit('navigate_to_lobby', roomCode);
    await hostReset;
    check('host still can', true);

    host.close(); guest.close();
  }

  // ------------------------------------------------------------------- caching
  console.log('\nrepeat fetches are served from cache');
  {
    const t0 = Date.now();
    const r1 = await fetch(`${URL}/api/wiki/Photosynthesis`);
    await r1.json();
    const cold = Date.now() - t0;

    const t1 = Date.now();
    const r2 = await fetch(`${URL}/api/wiki/Photosynthesis`);
    const body2 = await r2.json();
    const warm = Date.now() - t1;

    check('cached read is much faster', warm < cold / 2, `cold ${cold}ms, warm ${warm}ms`);
    check('cached read returns the same article', body2.title === 'Photosynthesis');

    // Different surface forms collapse onto the same cache entry.
    const t2 = Date.now();
    const r3 = await fetch(`${URL}/api/wiki/photosynthesis`);
    const body3 = await r3.json();
    const warm2 = Date.now() - t2;
    check('case variant hits the same entry', warm2 < cold / 2 && body3.title === 'Photosynthesis', `${warm2}ms`);
  }

  // ------------------------------------------------------------------ sanitisation
  console.log('\nserved markup carries nothing executable');
  {
    const res = await fetch(`${URL}/api/wiki/Cat`);
    const { content } = await res.json();
    check('no <script> tags', !/<script/i.test(content));
    check('no inline on* handlers', !/\son[a-z]+\s*=/i.test(content));
    check('no javascript: urls', !/javascript:/i.test(content));
    check('no protocol-relative image srcs left', !/src="\/\//.test(content));
    check('srcset was not corrupted', !/https:https:/.test(content) && !/https:\/\/\/\//.test(content));

    // Wikipedia's Kartographer URLs contain commas (…/img/osm-intl,13,a,a,270x200.png), so
    // any srcset rewrite that splits on commas shreds them. Only comma-then-whitespace
    // separates candidates; a bare comma sits inside a URL. So a candidate separator that
    // isn't followed by a URL means the value was mangled.
    const srcsets = [...content.matchAll(/srcset="([^"]+)"/g)].map((m) => m[1]);
    const mangled = srcsets.filter((value) => /,\s+(?!https?:)/.test(value));
    check('srcset candidates all start with a URL', mangled.length === 0,
      mangled.length ? mangled[0].slice(0, 90) : `${srcsets.length} srcset attrs checked`);
  }

  // A page whose infobox embeds a map — the case that exposed the comma bug.
  {
    const res = await fetch(`${URL}/api/wiki/${encodeURIComponent('Missouri Valley High School')}`);
    const { content } = await res.json();
    const srcsets = [...content.matchAll(/srcset="([^"]+)"/g)].map((m) => m[1]);
    const mangled = srcsets.filter((value) => /,\s+(?!https?:)/.test(value));
    check('map embed srcset survives intact', mangled.length === 0,
      mangled.length ? mangled[0].slice(0, 90) : 'kartographer URL commas preserved');
    check('article still has real content', content.length > 5000, `${content.length} bytes`);
  }

  // Wide tables are the main cause of an article scrolling sideways on a phone, so each
  // top-level one is wrapped in a scroll container server-side. Chess is used because it is
  // dense with data tables; infoboxes must stay unwrapped or their float breaks.
  console.log('\nwide tables are wrapped so they cannot widen the page');
  {
    const res = await fetch(`${URL}/api/wiki/Chess`);
    const { content } = await res.json();
    const wrapped = (content.match(/<div class="wiki-table-scroll">/g) || []).length;
    check('top-level tables are wrapped', wrapped > 0, `${wrapped} wrapped`);
    check('infoboxes are left alone',
      !/<div class="wiki-table-scroll">\s*<table[^>]*infobox/.test(content));
    check('wrappers do not nest', !/wiki-table-scroll[^]{0,200}?wiki-table-scroll[^]{0,40}?<table[^>]*>\s*<table/.test(content));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('\nHARNESS ERROR:', e.message); process.exit(1); });
