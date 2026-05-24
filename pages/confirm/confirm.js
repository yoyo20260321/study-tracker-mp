const api = require('../../utils/api.js');

Page({
  data: { path: '', grade: '', subject: '', loading: false },

  onLoad(opt) {
    this.setData({
      path: decodeURIComponent(opt.path || ''),
      grade: decodeURIComponent(opt.grade || '六年级'),
      subject: decodeURIComponent(opt.subject || '数学'),
    });
  },

  back() { wx.navigateBack(); },

  async submit() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const resp = await api.diagnoseUpload(this.data.path, this.data.grade, this.data.subject);
      const jobId = resp.jobId;
      wx.redirectTo({ url: `/pages/loading/loading?jobId=${jobId}` });
    } catch (err) {
      wx.showModal({ title: '提交失败', content: err.message, showCancel: false });
      this.setData({ loading: false });
    }
  },
});
