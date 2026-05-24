const api = require('../../utils/api.js');

Page({
  data: {
    loading: true,
    reportId: '',
    report: { meta: {}, weaknesses: [], next_week_plan: [], real_problem: '' },
    meta: {},
    total: 0,
    correct: 0,
    pct: 0,
    stars: 0,
    dots: [],
    ringColor: '#F59E0B',
    xpEarned: 0,
    taskIcons: ['🎯', '🧩', '⚡'],
  },

  onLoad(opt) {
    this.setData({ reportId: opt.id || '' });
    this.load();
  },

  async load() {
    try {
      const data = await api.report(this.data.reportId);
      const report = data.report || data;
      const meta = report.meta || {};
      const total = Number(meta.total_questions) || 0;
      const correct = Number(meta.correct_count) || 0;
      const pct = total > 0 ? Math.round(correct / total * 100) : 0;
      const stars = (String(meta.rating || '').match(/⭐/g) || []).length;
      const dots = Array.from({ length: total }, (_, i) => i < correct);
      const ringColor = pct >= 90 ? '#10b981' : pct >= 75 ? '#F59E0B' : '#fb7185';
      const xpEarned = 50 + (pct >= 90 ? 100 : Math.round(pct));

      this.setData({
        loading: false,
        report: {
          meta,
          weaknesses: report.weaknesses || [],
          next_week_plan: report.next_week_plan || [],
          real_problem: report.real_problem || '',
        },
        meta, total, correct, pct, stars, dots, ringColor, xpEarned,
      });
      wx.setNavigationBarTitle({ title: meta.unit || '诊断报告' });
    } catch (err) {
      wx.showModal({ title: '加载失败', content: err.message, showCancel: false });
      this.setData({ loading: false });
    }
  },

  goChat() {
    wx.showToast({ title: '追问功能 V1 上线', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: `我家娃考了 ${this.data.stars} 颗星 ⭐, 来看看 AI 老师怎么说`,
      path: '/pages/home/home',
      imageUrl: '',
    };
  },
});
