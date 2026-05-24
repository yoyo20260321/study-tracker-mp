const api = require('../../utils/api.js');

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三'];
const SUBJECTS = ['数学'];

Page({
  data: {
    grades: GRADES,
    gradeIdx: 5,
    subjects: SUBJECTS,
    subjectIdx: 0,
  },

  onLoad() {
    // 从 profile 拿默认值
    api.me().then((me) => {
      const gIdx = GRADES.indexOf(me.grade);
      const sIdx = SUBJECTS.indexOf(me.subject);
      this.setData({
        gradeIdx: gIdx >= 0 ? gIdx : 5,
        subjectIdx: sIdx >= 0 ? sIdx : 0,
      });
    }).catch(() => {});
  },

  onGradeChange(e)   { this.setData({ gradeIdx: Number(e.detail.value) }); },
  onSubjectChange(e) { this.setData({ subjectIdx: Number(e.detail.value) }); },

  chooseFromCamera() { this._chooseMedia(['camera']); },
  chooseFromAlbum()  { this._chooseMedia(['album']); },

  _chooseMedia(sourceType) {
    const grade = this.data.grades[this.data.gradeIdx];
    const subject = this.data.subjects[this.data.subjectIdx];
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType,
      sizeType: ['compressed'], camera: 'back',
      success: (res) => {
        const tempFile = res.tempFiles[0];
        wx.navigateTo({
          url: `/pages/confirm/confirm?path=${encodeURIComponent(tempFile.tempFilePath)}&grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`,
        });
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('cancel')) return;
        wx.showToast({ title: '拍照失败', icon: 'none' });
      },
    });
  },
});
