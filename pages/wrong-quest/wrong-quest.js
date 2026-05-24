const api = require('../../utils/api.js');

function fmtTime(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

Page({
  data: {
    loading: true,
    list: [],
    detail: null,
    labels: ['A', 'B', 'C', 'D', 'E'],
  },

  onShow() { this.load(); },

  async load() {
    this.setData({ loading: true });
    try {
      const raw = await api.wrongQuestions();
      const list = raw.map((item) => ({ ...item, last_time: fmtTime(item.last_wrong_at) }));
      this.setData({ list, loading: false });
    } catch (err) {
      console.error(err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  showDetail(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ detail: this.data.list[idx] });
  },

  closeDetail() {
    this.setData({ detail: null });
  },

  async clearAndClose() {
    const qId = this.data.detail?.q_id;
    if (!qId) return;
    try {
      await api.clearWrong(qId);
      const list = this.data.list.filter((item) => item.q_id !== qId);
      this.setData({ list, detail: null });
      wx.showToast({ title: '已清除', icon: 'success' });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
});
