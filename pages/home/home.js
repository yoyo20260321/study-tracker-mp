const api = require('../../utils/api.js');
const app = getApp();

// V0 等级 / streak 等数据后端还没有, 本地 mock; 后续接 /api/auth/me/stats
function mockStats(reportCount) {
  const xp = 50 * reportCount + 27;
  const level = Math.floor(xp / 100) + 1;
  const xp_in_level = xp - (level - 1) * 100;
  const xp_max = level * 100;
  const LEVEL_NAMES = ['', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '工蜂', '工蜂', '工蜂', '工蜂', '工蜂', '巡蜂'];
  return {
    level, xp: xp_in_level, xp_max: 100,
    level_name: LEVEL_NAMES[level] || '蜂王',
    xp_pct: Math.round(xp_in_level / 100 * 100),
    streak: Math.min(reportCount, 7),
    remaining: Math.max(0, 5 - reportCount),
  };
}

Page({
  data: {
    stats: { level: 1, xp: 0, xp_max: 100, level_name: '蜜蜂学徒', xp_pct: 0, streak: 0, remaining: 5 },
    weaknesses: [],
    history: [],
  },

  onShow() {
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().finally(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    try {
      const list = await api.reports();
      const recent = (list || []).slice(0, 5);
      const history = recent.map(r => {
        const d = new Date(r.created_at * 1000);
        const score = Math.round((r.report?.meta?.correct_count || 0) / (r.report?.meta?.total_questions || 1) * 100) || 60;
        return { date: `${d.getMonth() + 1}/${d.getDate()}`, score };
      }).reverse();

      // weakness aggregation (按 title 频次)
      const wCount = new Map();
      list.slice(0, 5).forEach((r, i) => {
        (r.report?.weaknesses || []).forEach(w => {
          const k = (w.title || '').slice(0, 14);
          if (!k) return;
          const cur = wCount.get(k) || { tag: k, count: 0, recent: false };
          cur.count++;
          if (i === 0) cur.recent = true;
          wCount.set(k, cur);
        });
      });
      const weaknesses = [...wCount.values()].sort((a, b) => b.count - a.count).slice(0, 3);

      this.setData({
        stats: mockStats(list.length),
        weaknesses,
        history,
      });
    } catch (err) {
      console.error('home refresh fail:', err);
    }
  },

  goShoot() { wx.navigateTo({ url: '/pages/shoot/shoot' }); },
  goPay()   { wx.navigateTo({ url: '/pages/pay/pay' }); },
});
