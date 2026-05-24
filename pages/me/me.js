const api = require('../../utils/api.js');
const app = getApp();

// RPG 等级名 (按 stats.level 映射, 不用后端 level_band)
const LEVEL_NAMES = ['', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒',
                     '工蜂', '工蜂', '工蜂', '工蜂', '工蜂',
                     '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂'];
function levelName(level) { return LEVEL_NAMES[level] || '蜂王'; }

Page({
  data: {
    user: {},
    createdText: '',
    reportCount: 0,
    stats: { level: 1, xp: 0, xp_max: 100, level_name: '蜜蜂学徒', xp_pct: 0, streak_current: 0 },
    referral: { count: 0, total_xp_earned: 0 },
    menus: [
      { key: 'invite',  icon: '🎁', name: '邀请有礼', sub: '拉新得免费次数' },
      { key: 'msgs',    icon: '📩', name: '消息中心', sub: '' },
      { key: 'setting', icon: '⚙️', name: '设置', sub: '' },
      { key: 'help',    icon: '❓', name: '帮助 / 反馈', sub: '' },
    ],
    badgeCount: 0,
    wrongCount: 0,
    showBadgeModal: false,
    allBadges: [],
  },

  onShow() { this.refresh(); },

  async refresh() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    try {
      const [me, list, statsRaw, referralData, badgesData, wrongData] = await Promise.all([
        api.me(),
        api.reports(),
        api.statsMe(),
        api.referralsMy().catch(() => ({ count: 0, total_xp_earned: 0 })),
        api.badgesMe().catch(() => ({ earned: [], all: [] })),
        api.wrongQuestions().catch(() => []),
      ]);

      const xp_pct = statsRaw.xp_max > 0
        ? Math.round((statsRaw.xp / statsRaw.xp_max) * 100)
        : 0;

      const earnedSet = new Set((badgesData.earned || []).map((b) => b.type));
      const allBadges = (badgesData.all || []).map((b) => ({ ...b, earned: earnedSet.has(b.type) }));
      app.globalData.user = me;
      app.globalData.stats = statsRaw;

      this.setData({
        user: me,
        createdText: new Date(me.created_at * 1000).toLocaleDateString(),
        reportCount: list.length,
        referral: { count: referralData.count, total_xp_earned: referralData.total_xp_earned },
        stats: {
          level: statsRaw.level,
          xp: statsRaw.xp,
          xp_max: statsRaw.xp_max,
          level_name: levelName(statsRaw.level),
          xp_pct,
          streak_current: statsRaw.streak_current,
        },
        badgeCount: badgesData.earned?.length ?? 0,
        wrongCount: wrongData.length,
        allBadges,
      });
    } catch (err) {
      console.error(err);
    }
  },

  onMenu(e) {
    const k = e.currentTarget.dataset.key;
    if (k === 'invite') {
      this.onInvite();
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  onInvite() {
    wx.navigateTo({ url: '/pages/share/share' });
  },

  showBadges() { this.setData({ showBadgeModal: true }); },
  closeBadges() { this.setData({ showBadgeModal: false }); },
  goWrongQuest() { wx.navigateTo({ url: '/pages/wrong-quest/wrong-quest' }); },
  goLeaderboard() { wx.navigateTo({ url: '/pages/leaderboard/leaderboard' }); },

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
