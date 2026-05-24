// app.js - 全局入口

// L3 fix: API base 按小程序版本切换 (develop/trial/release)
// develop = 微信开发者工具 / 真机调试; trial = 体验版; release = 正式版上架
const API_BASE_BY_ENV = {
  develop: 'https://study.growclaw.top',
  trial:   'https://study.growclaw.top',  // 等 ICP 备案后换备案域名
  release: 'https://study.growclaw.top',  // 等 ICP 备案后换备案域名
};

function resolveApiBase() {
  try {
    const env = wx.getAccountInfoSync().miniProgram.envVersion;
    return API_BASE_BY_ENV[env] || API_BASE_BY_ENV.develop;
  } catch {
    return API_BASE_BY_ENV.develop;
  }
}

App({
  globalData: {
    apiBase: resolveApiBase(),
    token: null,
    user: null,
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    if (token) this.globalData.token = token;
    if (user) this.globalData.user = user;
    console.log('[蜂学] onLaunch, apiBase=', this.globalData.apiBase, 'token=', !!token);

    const opts = wx.getLaunchOptionsSync();
    const ref = opts?.query?.ref;
    if (ref) wx.setStorageSync('pending_ref', ref);
  },
});
