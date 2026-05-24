const api = require('../../utils/api.js');

function fmtDate(ts) {
  const d = new Date(ts * 1000);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `今天 ${hh}:${mm}`;
  if (isYest) return `昨天 ${hh}:${mm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

Page({
  data: { list: [], loading: true },

  onShow() { this.refresh(); },
  onPullDownRefresh() { this.refresh().finally(() => wx.stopPullDownRefresh()); },

  async refresh() {
    try {
      const list = await api.reports();
      const items = (list || []).map(r => {
        const m = r.report?.meta || {};
        const total = Number(m.total_questions) || 0;
        const correct = Number(m.correct_count) || 0;
        const score = total > 0 ? Math.round(correct / total * 100) : 0;
        const stars = (String(m.rating || '').match(/⭐/g) || []).length;
        return {
          id: r.id,
          unit: m.unit || '诊断报告',
          score, stars,
          dateText: fmtDate(r.created_at),
        };
      });
      this.setData({ list: items, loading: false });
    } catch (err) {
      console.error(err);
      this.setData({ loading: false });
    }
  },

  goReport(e) { wx.navigateTo({ url: `/pages/report/report?id=${e.currentTarget.dataset.id}` }); },
  goShoot() { wx.switchTab({ url: '/pages/home/home' }); },
});
