const app = getApp();

Page({
  data: {
    posterImg: '',
  },

  onLoad() {
    this.drawPoster();
  },

  drawPoster() {
    const ctx = wx.createCanvasContext('posterCanvas');
    const width = 600;
    const height = 800;
    const user = app.globalData.user || {};
    const stats = app.globalData.stats || {};

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#FFFBEB');
    gradient.addColorStop(1, '#FEF3C7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 顶部装饰条
    ctx.fillStyle = '#B45309';
    ctx.fillRect(0, 0, width, 20);

    // Logo/标题
    ctx.fillStyle = '#B45309';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐝 蜂学', width / 2, 100);

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#92400E';
    ctx.fillText('邀请好友一起学', width / 2, 140);

    // 用户头像（占位）
    ctx.beginPath();
    ctx.arc(width / 2, 240, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('👤', width / 2, 255);

    // 用户信息
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(user.phone || '蜂学学员', width / 2, 340);

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(`${user.grade || ''} · ${user.city || ''}`, width / 2, 380);

    // 数据卡片
    const cardY = 440;
    const cardHeight = 120;
    ctx.fillStyle = '#fff';
    ctx.fillRect(40, cardY, width - 80, cardHeight);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, cardY, width - 80, cardHeight);

    // 三个数据
    const items = [
      { label: '等级', value: `Lv.${stats.level || 1}`, color: '#7C3AED' },
      { label: '经验', value: `${stats.xp || 0} XP`, color: '#D97706' },
      { label: '连续打卡', value: `${stats.streak_current || 0} 天`, color: '#EF4444' },
    ];

    const itemWidth = (width - 80) / 3;
    items.forEach((item, i) => {
      const x = 40 + i * itemWidth + itemWidth / 2;
      ctx.fillStyle = item.color;
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(item.value, x, cardY + 50);

      ctx.fillStyle = '#6B7280';
      ctx.font = '24px sans-serif';
      ctx.fillText(item.label, x, cardY + 85);
    });

    // 邀请语
    ctx.fillStyle = '#1F2937';
    ctx.font = '32px sans-serif';
    ctx.fillText('扫码加入，一起进步！', width / 2, 620);

    // 二维码占位（实际应从服务端获取）
    ctx.fillStyle = '#fff';
    ctx.fillRect(220, 650, 160, 160);
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.strokeRect(220, 650, 160, 160);

    ctx.fillStyle = '#1F2937';
    ctx.font = '24px sans-serif';
    ctx.fillText('扫码注册', width / 2, 740);

    // 底部品牌
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '20px sans-serif';
    ctx.fillText('蜂学 · 群蜂智能出品', width / 2, height - 40);

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          width,
          height,
          success: (res) => {
            this.setData({ posterImg: res.tempFilePath });
          },
          fail: (err) => {
            console.error('Canvas to image failed:', err);
            wx.showToast({ title: '生成失败', icon: 'none' });
          },
        });
      }, 500);
    });
  },

  savePoster() {
    if (!this.data.posterImg) {
      wx.showToast({ title: '海报生成中...', icon: 'none' });
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImg,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) wx.openSetting();
            },
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
    });
  },

  onShareAppMessage() {
    const user = app.globalData.user || {};
    return {
      title: `我在蜂学学习，一起来挑战吧！`,
      path: `/pages/login/login?ref=${user.id || ''}`,
      imageUrl: this.data.posterImg || '',
    };
  },
});
