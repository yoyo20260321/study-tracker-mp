const api = require('../../utils/api.js');
const app = getApp();

const LEVEL_NAMES = ['', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒',
                     '工蜂', '工蜂', '工蜂', '工蜂', '工蜂',
                     '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂'];
function levelName(level) { return LEVEL_NAMES[level] || '蜂王'; }

Page({
  data: {
    stats: { level: 1, xp: 0, xp_max: 100, level_name: '蜜蜂学徒', xp_pct: 0, streak_current: 0, today_lesson_count: 0 },
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
      const [statsRaw, list] = await Promise.all([api.statsMe(), api.reports()]);

      const xp_pct = statsRaw.xp_max > 0
        ? Math.round((statsRaw.xp / statsRaw.xp_max) * 100)
        : 0;

      const stats = {
        level: statsRaw.level,
        xp: statsRaw.xp,
        xp_max: statsRaw.xp_max,
        level_name: levelName(statsRaw.level),
        xp_pct,
        streak_current: statsRaw.streak_current,
        today_lesson_count: statsRaw.today_lesson_count || 0,
      };

      const recent = (list || []).slice(0, 5);
      const history = recent.map(r => {
        const d = new Date(r.created_at * 1000);
        const score = Math.round((r.report?.meta?.correct_count || 0) / (r.report?.meta?.total_questions || 1) * 100) || 60;
        return { date: `${d.getMonth() + 1}/${d.getDate()}`, score };
      }).reverse();

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

      this.setData({ stats, weaknesses, history });
    } catch (err) {
      console.error('home refresh fail:', err);
    }
  },

  goLesson() { wx.switchTab({ url: '/pages/lesson/topics/topics' }); },
  goShoot()  { wx.navigateTo({ url: '/pages/shoot/shoot' }); },
  goPay()    { wx.navigateTo({ url: '/pages/pay/pay' }); },
});
