const api = require('../../utils/api.js');
const app = getApp();

Page({
  data: {
    loading: true,
    enough: false,
    message: '',
    top: [],
    me: null,
    medals: ['🥇', '🥈', '🥉'],
    period: 'all',
  },

  onShow() { this.load(); },

  switchTab(e) {
    const period = e.currentTarget.dataset.period;
    if (period === this.data.period) return;
    this.setData({ period });
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      const user = app.globalData.user || {};
      const result = await api.leaderboard(user.city || '', user.grade || '', this.data.period);
      if (!result.enough_data) {
        this.setData({ loading: false, enough: false, message: result.message });
        return;
      }
      this.setData({
        loading: false,
        enough: true,
        top: result.top,
        me: result.me,
      });
    } catch (err) {
      console.error(err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
});
