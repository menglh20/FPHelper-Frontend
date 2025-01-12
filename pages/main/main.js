// pages/main/main.js
Page({
  data: {
    username: '',
    motto: '由北京天坛医院和清华大学联合开发\n目前检测数据仅供参考\n拍摄的照片不会用于其他任何用途',
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