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
  }
})