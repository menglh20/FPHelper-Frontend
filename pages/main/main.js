// pages/main/main.js
Page({
  data: {
    motto: '欢迎使用FPHelper',
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

  },
  bindViewUploadVideo() {

  },
  bindViewGetHistory() {
    
  }
})