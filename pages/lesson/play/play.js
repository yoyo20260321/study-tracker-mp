const api = require('../../../utils/api.js');

Page({
  data: {
    topicId: '',
    sessionId: '',
    questions: [],
    idx: 0,
    total: 0,
    question: {},
    selected: null,
    fillAnswer: '',
    revealed: false,
    canCheck: false,
    isCorrect: false,
    lastXp: 0,
    correctCount: 0,
    streak: 0,
    letters: ['A', 'B', 'C', 'D', 'E'],
    answerText: '',
    explanation: '',
    results: [],
    loading: true,
  },

  async onLoad(opt) {
    const topicId = opt.topic || 'g6-fraction-add-sub';
    try {
      const data = await api.lessonStart(topicId);
      const questions = (data.questions || []).map((q) => ({
        ...q,
        tag: `${data.topic.name} · ${q.difficulty}星`,
      }));
      this.setData({
        topicId,
        sessionId: data.session_id,
        questions,
        total: questions.length,
        idx: 0,
        question: questions[0],
        loading: false,
      });
    } catch (err) {
      wx.showModal({
        title: '加载失败', content: err.message, showCancel: false,
        complete: () => wx.navigateBack(),
      });
    }
  },

  pickOption(e) {
    if (this.data.revealed) return;
    const i = Number(e.currentTarget.dataset.i);
    this.setData({ selected: i, canCheck: true });
  },

  onFillInput(e) {
    if (this.data.revealed) return;
    const v = e.detail.value.trim();
    this.setData({ fillAnswer: v, canCheck: v.length > 0 });
  },

  async check() {
    if (!this.data.canCheck || this.data.revealed) return;
    const q = this.data.question;
    const userAnswer = q.type === 'single_choice'
      ? this.data.letters[this.data.selected]
      : this.data.fillAnswer;

    try {
      const res = await api.lessonSubmit(this.data.sessionId, q.id, userAnswer);
      const correct = res.correct;
      this.setData({
        revealed: true,
        isCorrect: correct,
        lastXp: res.xp,
        answerText: res.answer_text || res.answer,
        explanation: res.explanation || '',
        correctCount: this.data.correctCount + (correct ? 1 : 0),
        results: [...this.data.results, { q_id: q.id, user_answer: userAnswer, correct }],
      });
      wx.vibrateShort({ type: correct ? 'light' : 'medium' });
    } catch (err) {
      wx.showToast({ title: '提交失败: ' + err.message, icon: 'none' });
    }
  },

  async nextQuestion() {
    const next = this.data.idx + 1;
    if (next >= this.data.total) {
      // 通关 → finish
      try {
        const fin = await api.lessonFinish(this.data.sessionId, this.data.results);
        wx.redirectTo({
          url: `/pages/lesson/result/result?topic=${this.data.topicId}&correct=${fin.correct}&total=${fin.total}&xp=${fin.xp_earned}&streak=${fin.stats.streak_current}`,
        });
      } catch (err) {
        wx.showToast({ title: '结算失败: ' + err.message, icon: 'none' });
      }
      return;
    }
    this.setData({
      idx: next,
      question: this.data.questions[next],
      selected: null,
      fillAnswer: '',
      revealed: false,
      canCheck: false,
      isCorrect: false,
      answerText: '',
      explanation: '',
    });
  },

  confirmQuit() {
    wx.showModal({
      title: '退出关卡?',
      content: '你的进度不会保存哦',
      confirmText: '退出',
      cancelText: '继续做',
      success: (res) => { if (res.confirm) wx.navigateBack(); },
    });
  },
});
