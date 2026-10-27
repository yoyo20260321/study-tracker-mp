const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../pages/share/share.js'), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));

function loadPage(globalData) {
  const calls = { canvas: [], exports: [], saves: [], toasts: [], modals: [], updates: [], errors: [], settings: 0 };
  const timers = [];
  let drawCallback;
  let definition;
  const ctx = {};
  for (const name of ['fillText', 'fillRect', 'beginPath', 'arc', 'fill', 'strokeRect']) {
    ctx[name] = (...args) => calls.canvas.push([name, ...args]);
  }
  ctx.createLinearGradient = (...args) => {
    calls.canvas.push(['createLinearGradient', ...args]);
    return { addColorStop: (...stops) => calls.canvas.push(['addColorStop', ...stops]) };
  };
  ctx.draw = (reserve, callback) => {
    calls.canvas.push(['draw', reserve]);
    drawCallback = callback;
  };
  vm.runInNewContext(source, {
    getApp: () => ({ globalData }),
    Page: (value) => { definition = value; },
    wx: {
      createCanvasContext: (id) => {
        calls.canvas.push(['createCanvasContext', id]);
        return ctx;
      },
      canvasToTempFilePath: (options) => calls.exports.push({ options, canvas: plain(calls.canvas) }),
      saveImageToPhotosAlbum: (options) => calls.saves.push(options),
      showToast: (options) => calls.toasts.push(plain(options)),
      showModal: (options) => calls.modals.push(options),
      openSetting: () => { calls.settings += 1; },
    },
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
    console: { error: (...args) => calls.errors.push(args) },
  }, { filename: 'pages/share/share.js' });
  const page = { ...definition, data: plain(definition.data), setData(update) {
    calls.updates.push(plain(update));
    Object.assign(this.data, update);
  } };
  return { page, calls, timers, finishDraw() { drawCallback(); }, runTimer() { timers.shift().callback(); } };
}

function exportPoster(harness) {
  const { page, calls, timers } = harness;
  page.onLoad();
  assert.equal(calls.exports.length, 0);
  assert.equal(timers.length, 0);
  harness.finishDraw();
  assert.equal(calls.exports.length, 0);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 500);
  harness.runTimer();
  assert.equal(calls.exports.length, 1);
  const options = calls.exports[0].options;
  assert.deepEqual(plain(options), { canvasId: 'posterCanvas', width: 600, height: 800 });
  assert.equal(page.data.posterImg, '');
  options.success({ tempFilePath: 'mock://synthetic-poster.png' });
  assert.deepEqual(calls.updates, [{ posterImg: 'mock://synthetic-poster.png' }]);
}

const syntheticPhone = '13800001234';
for (const [name, input] of [
  ['synthetic string', { user: { phone: syntheticPhone, id: 'synthetic-id', grade: '七年级', city: '测试城' }, stats: { level: 7, xp: 321, streak_current: 9 } }],
  ['JSON input', JSON.parse('{"user":{"phone":"13800001234","id":"synthetic-id","grade":"七年级","city":"测试城"},"stats":{"level":7,"xp":321,"streak_current":9}}')],
  ['JSON numeric phone', JSON.parse('{"user":{"phone":13800001234,"id":"synthetic-id","grade":"七年级","city":"测试城"},"stats":{"level":7,"xp":321,"streak_current":9}}')],
]) {
  test(`masks phone before canvas drawing and export: ${name}`, () => {
    const before = plain(input);
    const user = input.user;
    const h = loadPage(input);
    exportPoster(h);
    const texts = h.calls.canvas.filter(([name]) => name === 'fillText');
    assert.deepEqual(texts.map((call) => call[1]), [
      '🐝 蜂学', '邀请好友一起学', '👤', '138****1234', '七年级 · 测试城',
      'Lv.7', '等级', '321 XP', '经验', '9 天', '连续打卡',
      '扫码加入，一起进步！', '扫码注册', '蜂学 · 群蜂智能出品',
    ]);
    assert.deepEqual(texts.find((call) => call[3] === 340), ['fillText', '138****1234', 300, 340]);
    assert.equal(JSON.stringify(h.calls.canvas).includes(syntheticPhone), false);
    assert.equal(JSON.stringify(h.calls.exports).includes(syntheticPhone), false);
    assert.equal(input.user, user);
    assert.deepEqual(input, before);
    h.page.savePoster();
    assert.equal(h.calls.saves.length, 1);
    assert.equal(h.calls.saves[0].filePath, 'mock://synthetic-poster.png');
    h.calls.saves[0].success();
    assert.deepEqual(h.calls.toasts, [{ title: '已保存到相册', icon: 'success' }]);
    assert.deepEqual(plain(h.page.onShareAppMessage()), {
      title: '我在蜂学学习，一起来挑战吧！',
      path: '/pages/login/login?ref=synthetic-id', imageUrl: 'mock://synthetic-poster.png',
    });
  });
}

for (const [name, input] of [
  ['missing user', {}], ['null user', { user: null }], ['missing phone', { user: {} }],
  ['empty phone', { user: { phone: '' } }], ['null phone', { user: { phone: null } }],
]) {
  test(`default name and stats: ${name}`, () => {
    const before = plain(input);
    const h = loadPage(input);
    exportPoster(h);
    const texts = h.calls.canvas.filter(([name]) => name === 'fillText').map((call) => call[1]);
    assert.equal(texts[3], '蜂学学员');
    assert.equal(texts[4], ' · ');
    assert.ok(texts.includes('Lv.1'));
    assert.ok(texts.includes('0 XP'));
    assert.ok(texts.includes('0 天'));
    assert.deepEqual(input, before);
    assert.equal(h.page.onShareAppMessage().path, '/pages/login/login?ref=');
  });
}

test('pending poster, export failure and save failure behavior stays intact', () => {
  const h = loadPage({ user: { phone: syntheticPhone } });
  h.page.savePoster();
  assert.equal(h.calls.saves.length, 0);
  assert.deepEqual(h.calls.toasts.pop(), { title: '海报生成中...', icon: 'none' });
  assert.equal(h.page.onShareAppMessage().imageUrl, '');
  h.page.drawPoster();
  h.finishDraw();
  h.runTimer();
  h.calls.exports[0].options.fail({ errMsg: 'synthetic export error' });
  assert.equal(h.calls.errors.length, 1);
  assert.deepEqual(h.calls.toasts.pop(), { title: '生成失败', icon: 'none' });
  assert.equal(h.page.data.posterImg, '');
  h.calls.exports[0].options.success({ tempFilePath: 'mock://synthetic-poster.png' });
  h.page.savePoster();
  h.calls.saves[0].fail({ errMsg: 'synthetic save error' });
  assert.deepEqual(h.calls.toasts.pop(), { title: '保存失败', icon: 'none' });
  h.calls.saves[0].fail({ errMsg: 'auth deny' });
  const modal = h.calls.modals[0];
  assert.deepEqual(plain(modal), { title: '提示', content: '需要您授权保存相册权限', confirmText: '去设置' });
  modal.success({ confirm: false });
  assert.equal(h.calls.settings, 0);
  modal.success({ confirm: true });
  assert.equal(h.calls.settings, 1);
  assert.equal(JSON.stringify(h.calls.canvas).includes(syntheticPhone), false);
  assert.equal(JSON.stringify(h.calls.exports).includes(syntheticPhone), false);
});
