// utils/api.js - 封装 wx.request, 自动带 JWT, 处理错误

const app = getApp();

function request({ url, method = 'GET', data, header = {}, requireAuth = true }) {
  const base = app.globalData.apiBase;
  const fullUrl = url.startsWith('http') ? url : base + url;
  const reqHeader = { 'Content-Type': 'application/json', ...header };

  if (requireAuth) {
    const token = app.globalData.token || wx.getStorageSync('token');
    if (token) reqHeader['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header: reqHeader,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('user');
          app.globalData.token = null;
          app.globalData.user = null;
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error('登录失效, 请重新登录'));
        } else {
          const msg = (res.data && (res.data.error || res.data.message)) || `HTTP ${res.statusCode}`;
          reject(new Error(msg));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '网络异常')),
    });
  });
}

function uploadFile({ url, filePath, formData = {}, name = 'file', requireAuth = true }) {
  const base = app.globalData.apiBase;
  const fullUrl = url.startsWith('http') ? url : base + url;
  const header = {};
  if (requireAuth) {
    const token = app.globalData.token || wx.getStorageSync('token');
    if (token) header['Authorization'] = `Bearer ${token}`;
  }
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: fullUrl,
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(data.error || `HTTP ${res.statusCode}`));
        } catch {
          reject(new Error('返回非 JSON'));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '上传失败')),
    });
  });
}

module.exports = {
  request,
  uploadFile,

  // ── 业务封装 ──
  sendCode: (phone) => request({ url: '/api/auth/code', method: 'POST', data: { phone }, requireAuth: false }),
  login: (phone, code) => request({ url: '/api/auth/login', method: 'POST', data: { phone, code }, requireAuth: false }),
  me: () => request({ url: '/api/auth/me' }),
  updateProfile: (patch) => request({ url: '/api/auth/me/profile', method: 'PUT', data: patch }),
  reports: () => request({ url: '/api/reports' }),
  report: (id) => request({ url: `/api/reports/${id}` }),
  diagnoseUpload: (filePath, grade, subject) => uploadFile({
    url: '/api/diagnose',
    filePath,
    name: 'image',
    formData: { grade, subject },
  }),
  diagnoseStatus: (jobId) => request({ url: `/api/diagnose/${jobId}` }),
  chat: (reportId, message) => request({ url: '/api/chat', method: 'POST', data: { reportId, message } }),
  chatStatus: (chatJobId) => request({ url: `/api/chat/${chatJobId}` }),

  // V0.6 lessons
  lessonTopics: (grade) => request({ url: '/api/lessons/topics' + (grade ? `?grade=${encodeURIComponent(grade)}` : '') }),
  lessonStart: (topic_id) => request({ url: '/api/lessons/start', method: 'POST', data: { topic_id } }),
  lessonSubmit: (session_id, q_id, user_answer) => request({ url: '/api/lessons/submit', method: 'POST', data: { session_id, q_id, user_answer } }),
  lessonFinish: (session_id, results) => request({ url: '/api/lessons/finish', method: 'POST', data: { session_id, results } }),

  // V0.6 stats
  statsMe: () => request({ url: '/api/stats/me' }),
  statsOnboarding: (level_band, goal) => request({ url: '/api/stats/onboarding', method: 'PUT', data: { level_band, goal } }),



  // V0.8 P3 recommendations
  recommendations: (reportId) => request({ url: `/api/recommendations?from=report&report_id=${encodeURIComponent(reportId)}` }),

  // V0.8 P4 referrals
  referralsTrack: (ref) => request({ url: '/api/referrals/track', method: 'POST', data: { ref } }),
  referralsMy: () => request({ url: '/api/referrals/my' }),


  // V0.8 P5 growth
  badgesMe: () => request({ url: '/api/badges/me' }),
  wrongQuestions: () => request({ url: '/api/wrong-questions' }),
  clearWrong: (q_id) => request({ url: '/api/wrong-questions/clear', method: 'POST', data: { q_id } }),
  leaderboard: (city, grade, period) => request({ url: `/api/leaderboard?city=${encodeURIComponent(city || '')}&grade=${encodeURIComponent(grade || '')}${period === 'week' ? '&period=week' : ''}` }),

};
