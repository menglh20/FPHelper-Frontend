// pages/detect/detect.js
Page({
  data: {
    username: '',
  },
  onLoad(options) {
    const app = getApp()
    const username = app.globalData.username
    this.setData({
      'username': username
    })
  },
  bindViewTakePhoto() {
    wx.navigateTo({
      url: '../camera/camera',
    })
  },
  bindViewRecordVideo() {
    wx.navigateTo({
      url: '../recorder/recorder',
    })
  },

  bindViewUploadPhoto() {

  },

  bindViewUploadVideo() {
    const that = this; // 保存上下文
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'], // 仅允许从相册选择
      compressed: true, // 压缩视频
      maxDuration: 70, // 设置视频允许的最大时长
      success(res) {
        const tempFile = res.tempFiles[0];
        console.log(tempFile)
        const tempFilePath = tempFile.tempFilePath; // 视频路径
        const duration = tempFile.duration; // 视频时长（秒）
        const sizeMB = tempFile.size / 1024 / 1024; // 视频大小（MB）

        // 校验时长
        if (duration < 40 || duration > 70) {
          wx.showToast({
            title: '视频时长必须在40-70秒之间',
            icon: 'none',
          });
          return;
        }

        // 校验大小
        if (sizeMB > 40) {
          wx.showToast({
            title: '视频大小不能超过40MB',
            icon: 'none',
          });
          return;
        }

        wx.navigateTo({
          url: `../preview/preview?videoPath=${encodeURIComponent(tempFilePath)}`, // 使用 encodeURIComponent 处理路径
        });
      },
      fail(err) {
        console.error("用户取消或选择视频失败：", err);
        wx.showToast({
          title: '视频选择失败',
          icon: 'none',
        });
      }
    });
  },
})