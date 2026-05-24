Page({
  data: {
    plans: [
      { key: '5pack',  icon: '🎫', iconBg: '#FEF3C7', name: '5 次诊断包', desc: '¥1.98/次 · 适合先试试',          price: '9.9' },
      { key: 'month',  icon: '📅', iconBg: '#F59E0B', name: '月卡 · 不限次', desc: '30 天无限诊断 + 历史对比 + 专属徽章', price: '39', oldPrice: '69', recommended: true },
      { key: 'year',   icon: '👑', iconBg: '#DDE5D6', name: '年卡 · 全家共享', desc: '12 个月 + 多娃账号 + 报告导出', price: '299' },
    ],
  },

  pick(e) {
    const key = e.currentTarget.dataset.key;
    wx.showModal({
      title: 'V0 内测期',
      content: `${key} 套餐已记录, 微信支付待 ICP 备案 + 商户号下来后开通。\n\n暂时把你加入"白名单不限次"了, 继续用吧 🐝`,
      showCancel: false,
      success: () => wx.navigateBack(),
    });
  },
});
