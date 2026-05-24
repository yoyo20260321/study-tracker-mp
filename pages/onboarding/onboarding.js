const api = require('../../utils/api.js');

const GRADES = [
  { value: '一年级', num: '1', color: '#10b981' },
  { value: '二年级', num: '2', color: '#22c55e' },
  { value: '三年级', num: '3', color: '#0ea5e9' },
  { value: '四年级', num: '4', color: '#f59e0b' },
  { value: '五年级', num: '5', color: '#ef4444' },
  { value: '六年级', num: '6', color: '#a855f7' },
  { value: '初一',   num: '7', color: '#f97316' },
  { value: '初二',   num: '8', color: '#06b6d4' },
  { value: '初三',   num: '9', color: '#ec4899' },
];

const BANDS = [
  { value: '小学', icon: '🍎', color: '#ef4444' },
  { value: '初中', icon: '📐', color: '#0ea5e9' },
  { value: '高中', icon: '🎓', color: '#a855f7' },
];

const GOALS = [
  { value: 'keep_up',     icon: '🚶', color: '#10b981', text: '跟上学校进度' },
  { value: 'beat_class',  icon: '🏆', color: '#f59e0b', text: '超越同班同学' },
  { value: 'top_school',  icon: '🚀', color: '#ef4444', text: '冲刺名校' },
  { value: 'interest',    icon: '💡', color: '#a855f7', text: '我就是兴趣' },
];

Page({
  data: {
    step: 0,
    grades: GRADES, bands: BANDS, goals: GOALS,
    form: { grade: '', band: '', goal: '' },
    saving: false,
    error: '',
  },

  prevStep() {
    if (this.data.step === 0) {
      this.quit();
    } else {
      this.setData({ step: this.data.step - 1, error: '' });
    }
  },

  nextStep() {
    if (this.data.step >= 4) return;
    this.setData({ step: this.data.step + 1, error: '' });
  },

  quit() {
    wx.showModal({
      title: '稍后再来?',
      content: '关掉了下次还要重头开通哦',
      confirmText: '关掉',
      cancelText: '继续',
      success: (res) => { if (res.confirm) wx.switchTab({ url: '/pages/home/home' }); },
    });
  },

  pickGrade(e) { this.setData({ 'form.grade': e.currentTarget.dataset.v }); },
  pickBand(e)  { this.setData({ 'form.band':  e.currentTarget.dataset.v }); },
  pickGoal(e)  { this.setData({ 'form.goal':  e.currentTarget.dataset.v }); },

  async finish() {
    if (this.data.saving) return;
    this.setData({ saving: true, error: '' });
    try {
      // 接后端 PUT /api/stats/onboarding
      await api.statsOnboarding(this.data.form.band, this.data.form.goal);
      // 同步更新 profile 的 grade 字段
      try { await api.updateProfile({ grade: this.data.form.grade }); } catch {}
      // 本地持久化引导完成标记
      wx.setStorageSync('onboarding_done', true);
      wx.setStorageSync('onboarding_form', this.data.form);
      wx.showToast({ title: '欢迎来到蜂学 🐝', icon: 'success' });
      // 直接进入首关 — 按年级映射首推 topic
      setTimeout(() => {
        const topicByGrade = {
          '六年级': 'g6-fraction-add-sub',
          '初一': 'g7-rational',
        };
        const topic = topicByGrade[this.data.form.grade] || 'g6-fraction-add-sub';
        wx.redirectTo({ url: `/pages/lesson/play/play?topic=${topic}` });
      }, 1000);
    } catch (err) {
      this.setData({ error: err.message, saving: false });
    }
  },
});
