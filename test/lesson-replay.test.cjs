const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadPage(relativePath, wx, api) {
  let page;
  const filename = path.join(__dirname, '..', relativePath);
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    Page(definition) { page = definition; },
    wx,
    require(id) {
      assert.equal(id, '../../../utils/api.js');
      assert.ok(api, 'API must be explicitly stubbed');
      return api;
    },
  }, { filename });
  page.data = structuredClone(page.data);
  page.setData = function (values) { Object.assign(this.data, values); };
  return page;
}

function route(url, expectedPath) {
  const parsed = new URL(url, 'https://synthetic.invalid');
  assert.equal(parsed.pathname, expectedPath);
  return Object.fromEntries(parsed.searchParams);
}

for (const [name, options, expectedTopic, correct] of [
  ['non-default', { topic: 'g7-rational' }, 'g7-rational', 1],
  ['missing topic', {}, 'g6-fraction-add-sub', 2],
  ['empty topic', { topic: '' }, 'g6-fraction-add-sub', 1],
]) {
  test(`${name}: real play completion → result → replay → play preserves topic and stats`, async () => {
    const redirects = [];
    const starts = [];
    const finishes = [];
    const wx = { redirectTo({ url }) { redirects.push(url); } };
    const api = {
      async lessonStart(topic) {
        starts.push(topic);
        return {
          session_id: 'synthetic-session', topic: { name: 'Synthetic topic' },
          questions: [1, 2].map(id => ({ id, difficulty: 1 })),
        };
      },
      async lessonFinish(session, results) {
        finishes.push({ session, results: structuredClone(results) });
        return { correct, total: 2, xp_earned: 30, stats: { streak_current: 4 } };
      },
    };
    const play = loadPage('pages/lesson/play/play.js', wx, api);
    await play.onLoad(options);
    const results = [{ q_id: 1, user_answer: 'A', correct: true }];
    play.setData({ idx: 1, results });
    await play.nextQuestion();
    assert.deepEqual(finishes, [{ session: 'synthetic-session', results }]);
    assert.equal(redirects.length, 1);
    const result = loadPage('pages/lesson/result/result.js', wx);
    result.onLoad(route(redirects[0], '/pages/lesson/result/result'));
    assert.equal(result.data.correct, correct);
    assert.equal(result.data.total, 2);
    assert.equal(result.data.xp, 30);
    assert.equal(result.data.streak, 4);
    assert.equal(result.data.perfect, correct === 2);
    result.again();
    assert.equal(redirects.length, 2);
    const replayOptions = route(redirects[1], '/pages/lesson/play/play');
    assert.deepEqual(replayOptions, { topic: expectedTopic });
    const replay = loadPage('pages/lesson/play/play.js', wx, api);
    await replay.onLoad(replayOptions);
    assert.deepEqual(starts, [expectedTopic, expectedTopic]);
    assert.equal(replay.data.topicId, expectedTopic);
    assert.equal(replay.data.loading, false);
  });
}

test('result encodes incoming topic as a single query value without changing its contents', () => {
  const topic = '七年级 &topic=other?x=1#片段/+%';
  let redirect;
  const result = loadPage('pages/lesson/result/result.js', {
    redirectTo({ url }) { redirect = url; },
  });
  result.onLoad({ topic, correct: '3', total: '5', xp: '24', streak: '7' });
  result.again();
  assert.equal(redirect, `/pages/lesson/play/play?topic=${encodeURIComponent(topic)}`);
  assert.deepEqual(route(redirect, '/pages/lesson/play/play'), { topic });
  assert.equal(new URL(redirect, 'https://synthetic.invalid').hash, '');
});

test('result retains missing-topic fallback, numeric defaults, perfect, share and back', () => {
  let redirect;
  let back;
  const result = loadPage('pages/lesson/result/result.js', {
    redirectTo({ url }) { redirect = url; },
    switchTab({ url }) { back = url; },
  });
  result.onLoad({});
  for (const [key, expected] of Object.entries({ correct: 0, total: 5, xp: 0, streak: 0, perfect: false })) {
    assert.equal(result.data[key], expected);
  }
  result.again();
  assert.equal(redirect, '/pages/lesson/play/play?topic=g6-fraction-add-sub');
  result.onLoad({ correct: '5', total: '5', xp: '50', streak: '8' });
  assert.equal(result.data.perfect, true);
  const share = result.onShareAppMessage();
  assert.equal(share.title, '🐝 我刚刚答对了 5/5 题, 连击 8 天!');
  assert.equal(share.path, '/pages/home/home');
  result.goBack();
  assert.equal(back, '/pages/lesson/topics/topics');
});
