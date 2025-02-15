// pages/recorder/recorder.js
Page({
  data: {},

  onLoad() {
    console.log("AI咨询页面加载中...");
  },

  // 返回主页的函数
  goBack() {
    wx.switchTab({
      url: '/pages/main/main', // 确保 main 页面路径正确
    });
  }
});