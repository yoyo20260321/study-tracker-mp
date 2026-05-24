Page({
  data: { correct: 0, total: 5, xp: 0, streak: 0, perfect: false },

  onLoad(opt) {
    const correct = Number(opt.correct || 0);
    const total = Number(opt.total || 5);
    const xp = Number(opt.xp || 0);
    const streak = Number(opt.streak || 0);
    this.setData({ correct, total, xp, streak, perfect: correct === total });
  },

  again() {
    wx.redirectTo({ url: '/pages/lesson/play/play?topic=g6-fraction-add-sub' });
  },

  goBack() {
    wx.switchTab({ url: '/pages/lesson/topics/topics' });
  },

  onShareAppMessage() {
    return {
      title: `🐝 我刚刚答对了 ${this.data.correct}/${this.data.total} 题, 连击 ${this.data.streak} 天!`,
      path: '/pages/home/home',
    };
  },
});
