const api = require('../../../utils/api.js');

const LEVEL_NAMES = ['', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒', '蜜蜂学徒',
                     '工蜂', '工蜂', '工蜂', '工蜂', '工蜂',
                     '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂', '巡蜂'];

Page({
  data: {
    stats: { streak_current: 0, xp: 0, level: 1, level_name: '蜜蜂学徒', streak_freezes: 0 },
    recommend: null,
    topics: [],
    loading: true,
  },

  onShow() {
    // 首次进 → 开通引导
    if (!wx.getStorageSync('onboarding_done')) {
      wx.navigateTo({ url: '/pages/onboarding/onboarding' });
      return;
    }
    this.refresh();
  },

  async refresh() {
    try {
      const [topics, stats] = await Promise.all([api.lessonTopics(), api.statsMe()]);
      const userGrade = (wx.getStorageSync('onboarding_form') || {}).grade;
      const enrich = (topics || []).map((t) => ({
        ...t,
        pct: t.total > 0 ? Math.round(t.done / t.total * 100) : 0,
        locked: false,  // V0 简化, 不做关卡解锁
      }));
      // 推荐第 1 个匹配用户年级的, 没匹配则第 1 个
      const recommend = enrich.find((t) => t.grade === userGrade) || enrich[0] || null;
      this.setData({
        stats: {
          ...stats,
          level_name: LEVEL_NAMES[stats.level] || '蜂王',
        },
        topics: enrich,
        recommend,
        loading: false,
      });
    } catch (err) {
      console.error('topics load', err);
      this.setData({ loading: false });
    }
  },

  goPlay(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/lesson/play/play?topic=${id}` });
  },
});
