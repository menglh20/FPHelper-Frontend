// app.js
App({
  onLaunch() {
    wx.cloud.init()
  },
  globalData: {
    username: '',
    detailData: {}
  }
})