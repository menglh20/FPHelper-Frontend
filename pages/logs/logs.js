// logs.js
const util = require('../../utils/util.js')

Page({
  data: {
    name: '',
    page: 1,
    total: 0,
    results: []
  },

  // 请求历史记录
  async fetchHistory() {
    const app = getApp()
    const name = app.globalData.username
    const { page } = this.data;

    console.log('fetchHistory')
    const res = await wx.cloud.callContainer({
      "config": {
        "env": "prod-4ggnzg0z43d1ab28"
      },
      "path": "/api/detect/history",
      "header": {
        "X-WX-SERVICE": "django-5dw4",
        "content-type": "application/json"
      },
      "method": "POST",
      "data": {
        "name": name,
        "page": page
      }
    })
    console.log(res)
    if (res.data.code === 200) {
      this.setData({
        total: res.data.total,
        results: res.data.results
      });
    } else {
      wx.showToast({
        title: res.data.message,
        icon: 'none'
      });
    }
  },

// 下一页
nextPage() {
  this.setData({ page: this.data.page + 1 }, this.fetchHistory);
},

// 上一页
previousPage() {
  this.setData({ page: this.data.page - 1 }, this.fetchHistory);
}
});

