const api = require('../../utils/api.js');

Page({
  data: { jobId: '', progress: 5, polling: false },

  onLoad(opt) {
    this.setData({ jobId: opt.jobId });
    this.startPoll();
    this.startProgress();
  },

  onUnload() { this.setData({ polling: false }); },

  startProgress() {
    const ti = setInterval(() => {
      if (!this.data.polling) { clearInterval(ti); return; }
      const next = Math.min(90, this.data.progress + 3);
      this.setData({ progress: next });
    }, 1500);
  },

  async startPoll() {
    this.setData({ polling: true });
    const start = Date.now();
    while (this.data.polling && Date.now() - start < 480000) {
      try {
        const res = await api.diagnoseStatus(this.data.jobId);
        if (res.status === 'done') {
          this.setData({ progress: 100 });
          // 后端 done 不返回 reportId, jobId 即 reportId (见 diagnose.ts 注释)
          const reportId = res.reportId || this.data.jobId;
          setTimeout(() => wx.redirectTo({ url: `/pages/report/report?id=${reportId}` }), 500);
          return;
        }
        if (res.status === 'failed') {
          wx.showModal({
            title: '诊断失败', content: res.error || '未知错误', showCancel: false,
            complete: () => wx.navigateBack(),
          });
          return;
        }
      } catch (err) {
        console.error('poll err', err);
      }
      await new Promise(r => setTimeout(r, 2500));
    }
    if (this.data.polling) {
      wx.showModal({ title: '超时', content: '诊断超过 8 分钟未完成, 请重试', showCancel: false });
    }
  },
});
