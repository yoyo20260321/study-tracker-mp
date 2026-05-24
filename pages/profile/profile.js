const api = require('../../utils/api.js');

// 9 个年级 + 多邻国式彩色徽章
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

// 19 个城市 + 代表 emoji (近似城市文化符号)
const CITIES = [
  { value: '北京', emoji: '🏯', color: '#ef4444' },
  { value: '上海', emoji: '🏙', color: '#0ea5e9' },
  { value: '广州', emoji: '🌴', color: '#10b981' },
  { value: '深圳', emoji: '🌆', color: '#a855f7' },
  { value: '杭州', emoji: '🍃', color: '#22c55e' },
  { value: '南京', emoji: '🏛', color: '#f59e0b' },
  { value: '成都', emoji: '🐼', color: '#ec4899' },
  { value: '武汉', emoji: '🌊', color: '#0ea5e9' },
  { value: '西安', emoji: '🏯', color: '#f97316' },
  { value: '天津', emoji: '🥟', color: '#ef4444' },
  { value: '苏州', emoji: '🌸', color: '#ec4899' },
  { value: '重庆', emoji: '🌶', color: '#ef4444' },
  { value: '长沙', emoji: '🍲', color: '#f97316' },
  { value: '青岛', emoji: '🍺', color: '#10b981' },
  { value: '宁波', emoji: '⚓', color: '#0ea5e9' },
  { value: '东莞', emoji: '🏭', color: '#a855f7' },
  { value: '无锡', emoji: '🦢', color: '#06b6d4' },
  { value: '合肥', emoji: '🌳', color: '#22c55e' },
  { value: '其他', emoji: '🗺',  color: '#94a3b8' },
];

Page({
  data: {
    step: 0,
    grades: GRADES,
    cities: CITIES,
    form: { grade: '', subject: '数学', city: '', school: '' },
    saving: false,
    error: '',
  },

  onLoad(opt) {
    // 老用户从「我的」点编辑进来 → 不强引导, 直接从已有 profile 起 step 1
    // 新用户首次 (opt.first==='1') → 从 step 0 引导
    if (opt.first === '1') {
      this.setData({ step: 0 });
    } else {
      this.setData({ step: 1 });
      api.me().then((me) => {
        this.setData({
          form: {
            grade: me.grade || '',
            subject: me.subject || '数学',
            city: me.city || '',
            school: me.school || '',
          },
        });
      }).catch(() => {});
    }
  },

  nextStep() {
    if (this.data.step >= 3) return;
    this.setData({ step: this.data.step + 1, error: '' });
  },

  prevStep() {
    if (this.data.step <= 0) {
      wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/home/home' }) });
      return;
    }
    this.setData({ step: this.data.step - 1, error: '' });
  },

  pickGrade(e) { this.setData({ 'form.grade': e.currentTarget.dataset.v }); },
  pickCity(e)  { this.setData({ 'form.city':  e.currentTarget.dataset.v }); },
  onSchool(e)  { this.setData({ 'form.school': e.detail.value }); },

  async finish() {
    if (this.data.saving) return;
    if (!this.data.form.grade || !this.data.form.city) {
      this.setData({ error: '年级 / 城市 缺一不可' });
      return;
    }
    this.setData({ saving: true, error: '' });
    try {
      await api.updateProfile(this.data.form);
      wx.showToast({ title: '欢迎来到蜂学 🐝', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 800);
    } catch (err) {
      this.setData({ error: err.message, saving: false });
    }
  },
});
