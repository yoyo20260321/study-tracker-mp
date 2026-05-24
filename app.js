// app.js - 全局入口
App({
  globalData: {
    // 后端 API base. ICP 备案前用 cloudflare tunnel 域名,
    // 真机调试模式 (urlCheck=false) 能调通; 体验版/正式版会被微信拦截.
    apiBase: 'https://study.growclaw.top',
    token: null,
    user: null,
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    if (token) this.globalData.token = token;
    if (user) this.globalData.user = user;
    console.log('[蜂学] onLaunch, token=', !!token);
  },
});
