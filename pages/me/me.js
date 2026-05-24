const api = require('../../utils/api.js');
const app = getApp();

Page({
  data: {
    user: {},
    createdText: '',
    reportCount: 0,
    stats: { level: 1, xp: 27, level_name: '蜜蜂学徒', xp_pct: 27, streak: 0, remaining: 5 },
    menus: [
      { key: 'badges',  icon: '🏅', name: '我的徽章', sub: '已获得 0 / 12' },
      { key: 'invite',  icon: '🎁', name: '邀请有礼', sub: '拉新得免费次数' },
      { key: 'msgs',    icon: '📩', name: '消息中心', sub: '' },
      { key: 'setting', icon: '⚙️', name: '设置', sub: '' },
      { key: 'help',    icon: '❓', name: '帮助 / 反馈', sub: '' },
    ],
  },

  onShow() { this.refresh(); },

  async refresh() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    try {
      const me = await api.me();
      const list = await api.reports();
      const reportCount = list.length;
      const xp = 50 * reportCount + 27;
      const level = Math.floor(xp / 100) + 1;
      const xp_in_level = xp - (level - 1) * 100;
      const LEVEL_NAMES = ['', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '工蜂'];
      this.setData({
        user: me,
        createdText: new Date(me.created_at * 1000).toLocaleDateString(),
        reportCount,
        stats: {
          level, xp: xp_in_level,
          level_name: LEVEL_NAMES[level] || '蜂王',
          xp_pct: Math.round(xp_in_level / 100 * 100),
          streak: Math.min(reportCount, 7),
          remaining: Math.max(0, 5 - reportCount),
        },
      });
    } catch (err) {
      console.error(err);
    }
  },

  onMenu(e) {
    const k = e.currentTarget.dataset.key;
    if (k === 'invite') {
      wx.showShareMenu({ withShareTicket: true });
      wx.showToast({ title: '邀请功能 V1 上线', icon: 'none' });
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  goPay()    { wx.navigateTo({ url: '/pages/pay/pay' }); },
  goProfile(){ wx.navigateTo({ url: '/pages/profile/profile' }); },

  logout() {
    wx.showModal({
      title: '退出登录', content: '确认退出?',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('user');
          app.globalData.token = null;
          app.globalData.user = null;
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },

  onShareAppMessage() {
    return { title: '蜂学 · 拍试卷 AI 帮你看', path: '/pages/home/home' };
  },
});
