// pages/main/main.js
Page({
  data: {
    username: ''
  },
  onLoad(options) {
    const app = getApp()
    const username = app.globalData.username
    this.setData({
      'username': username
    })
  },
  bindViewRecordVideo() {
    wx.navigateTo({
      url: '../camera/camera',
    })
  },
  bindViewGetHistory() {
    wx.navigateTo({
      url: '../logs/logs',
    })
  }
})