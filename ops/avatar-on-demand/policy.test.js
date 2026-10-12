'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createSession, IDLE_MS, WAKING_TEXT } = require('./policy');

function clock(start) {
  let t = start;
  return {
    now: function () { return t; },
    advance: function (ms) { t += ms; }
  };
}

test('sin visores no arranca Unreal', function () {
  const s = createSession();
  const d = s.viewers(0);
  assert.equal(d.phase, 'asleep');
  assert.equal(d.start, false);
  assert.equal(d.stop, false);
  assert.equal(d.message, '');
});

test('un visor pide un solo arranque y el texto de despertando', function () {
  const s = createSession();
  const d = s.viewers(1);
  assert.equal(d.start, true);
  assert.equal(d.phase, 'waking');
  assert.equal(d.message, WAKING_TEXT);
  assert.equal(WAKING_TEXT, 'despertando el avatar…');
  const again = s.viewers(2);
  assert.equal(again.start, false);
  assert.equal(again.phase, 'waking');
});

test('el endpoint de despertar arranca igual que un visor, y no dos veces', function () {
  const s = createSession();
  const d = s.wake();
  assert.equal(d.start, true);
  assert.equal(d.phase, 'waking');
  assert.equal(s.wake().start, false);
});

test('cuando el host responde pasa a up y deja de decir despertando', function () {
  const s = createSession();
  s.viewers(1);
  const d = s.host(true);
  assert.equal(d.phase, 'up');
  assert.equal(d.start, false);
  assert.equal(d.message, '');
});

test('con visores no se apaga a los 10 min', function () {
  const c = clock(0);
  const s = createSession({ now: c.now });
  s.viewers(1);
  s.host(true);
  c.advance(IDLE_MS + 1000);
  const d = s.tick();
  assert.equal(d.phase, 'up');
  assert.equal(d.stop, false);
});

test('sin visores sigue encendido a los 9 min y se apaga a los 10', function () {
  const c = clock(0);
  const s = createSession({ now: c.now });
  s.viewers(1);
  s.host(true);
  s.viewers(0);
  c.advance(9 * 60 * 1000);
  assert.equal(s.tick().stop, false);
  assert.equal(s.snapshot().phase, 'up');
  c.advance(60 * 1000);
  const d = s.tick();
  assert.equal(d.stop, true);
  assert.equal(d.phase, 'asleep');
  assert.equal(s.tick().stop, false);
});

test('un visor nuevo anula la cuenta atrás', function () {
  const c = clock(0);
  const s = createSession({ now: c.now });
  s.viewers(1);
  s.host(true);
  s.viewers(0);
  c.advance(9 * 60 * 1000);
  s.viewers(1);
  c.advance(5 * 60 * 1000);
  assert.equal(s.tick().phase, 'up');
  assert.equal(s.tick().stop, false);
});

test('despertar por endpoint sin visores también se apaga a los 10 min', function () {
  const c = clock(0);
  const s = createSession({ now: c.now });
  s.wake();
  s.host(true);
  c.advance(IDLE_MS);
  const d = s.tick();
  assert.equal(d.stop, true);
  assert.equal(d.phase, 'asleep');
});

test('el plist del streamer no vuelve a arrancar en el login', function () {
  const xml = fs.readFileSync(path.join(__dirname, 'com.admiranext.avatar-streamer.plist'), 'utf8');
  assert.equal(xml.includes('<key>KeepAlive</key>'), false);
  assert.match(xml, /<key>RunAtLoad<\/key>\s*<false\/>/);
  assert.match(xml, /com\.admiranext\.avatar-streamer/);
});
