const api = require('../../utils/api.js');
const app = getApp();

Page({
  data: {
    phone: '',
    code: '',
    codeCountdown: 0,
    loading: false,
    error: '',
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value, error: '' }); },
  onCodeInput(e)  { this.setData({ code:  e.detail.value, error: '' }); },

  async onSendCode() {
    const phone = this.data.phone.trim();
    if (!/^1\d{10}$/.test(phone)) {
      this.setData({ error: '手机号格式不对, 应为 11 位中国大陆手机号' });
      return;
    }
    try {
      await api.sendCode(phone);
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      this.startCountdown();
    } catch (err) {
      this.setData({ error: err.message });
    }
  },

  startCountdown() {
    this.setData({ codeCountdown: 60 });
    const timer = setInterval(() => {
      const n = this.data.codeCountdown - 1;
      this.setData({ codeCountdown: n });
      if (n <= 0) clearInterval(timer);
    }, 1000);
  },

  async onLogin() {
    const phone = this.data.phone.trim();
    const code = this.data.code.trim();
    if (!/^1\d{10}$/.test(phone)) return this.setData({ error: '手机号格式不对' });
    if (!/^\d{6}$/.test(code))    return this.setData({ error: '验证码应为 6 位数字' });

    this.setData({ loading: true, error: '' });
    try {
      const resp = await api.login(phone, code);
      app.globalData.token = resp.token;
      app.globalData.user = { userId: resp.userId, phone: resp.phone };
      wx.setStorageSync('token', resp.token);
      wx.setStorageSync('user', app.globalData.user);
      wx.showToast({ title: '登录成功', icon: 'success' });
      // 检查 profile 是否完整, 缺则引导填
      try {
        const me = await api.me();
        if (!me.profile_complete) {
          setTimeout(() => wx.redirectTo({ url: '/pages/profile/profile?first=1' }), 600);
          return;
        }
      } catch {}
      setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 600);
    } catch (err) {
      this.setData({ error: err.message, loading: false });
    }
  },
});
