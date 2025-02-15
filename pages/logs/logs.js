// logs.js
Page({
  data: {
    name: '',
    page: 1,
    total: 0,
    results: []
  },

  onShow() {
    // 页面显示时自动调用 fetchHistory
    this.fetchHistory();
  },

  // 请求历史记录
  async fetchHistory() {
    const app = getApp();
    const name = app.globalData.username;
    const { page } = this.data;

    wx.showLoading({ title: '加载中...' }); // 显示加载动画
    try {
      const res = await wx.cloud.callContainer({
        config: {
          env: 'prod-4ggnzg0z43d1ab28'
        },
        path: '/api/detect/history',
        header: {
          'X-WX-SERVICE': 'django-5dw4',
          'content-type': 'application/json'
        },
        method: 'POST',
        data: {
          name,
          page
        }
      });

      wx.hideLoading(); // 隐藏加载动画

      if (res.data.code === 200) {
        const results = res.data.results.map(item => {
          // console.log("Raw detail data:", item.detail); // 打印 detail 的原始值

          const parsedTime = this.addHoursToTime(item.time, 8)

          // 替换单引号为双引号，修复非标准 JSON 数据
          const fixedDetail = item.detail.replace(/'/g, '"');

          const rawDetail = JSON.parse(fixedDetail); // 解析修复后的 JSON 字符串


          // 提取需要的字段
          const parsedDetail = {
            'rest symmetry': {
              'eye': rawDetail?.['rest symmetry']?.eye || 0,
              'cheek': rawDetail?.['rest symmetry']?.cheek || 0,
              'mouth': rawDetail?.['rest symmetry']?.mouth || 0
            },
            'voluntary symmetry': {
              'forehead wrinkle': rawDetail?.['voluntary symmetry']?.['forehead wrinkle'] || 0,
              'eye closure': rawDetail?.['voluntary symmetry']?.['eye closure'] || 0,
              'smile': rawDetail?.['voluntary symmetry']?.smile || 0,
              'snarl': rawDetail?.['voluntary symmetry']?.snarl || 0,
              'lip pucker': rawDetail?.['voluntary symmetry']?.['lip pucker'] || 0
            },
            'synkinesis': {
              'forehead wrinkle': rawDetail?.synkinesis?.['forehead_wrinkle'] || 0,
              'eye closure': rawDetail?.synkinesis?.['eye_closure'] || 0,
              'smile': rawDetail?.synkinesis?.smile || 0,
              'snarl': rawDetail?.synkinesis?.snarl || 0,
              'lip pucker': rawDetail?.synkinesis?.['lip_pucker'] || 0
            }
          };

          return {
            ...item,
            detail: parsedDetail,
            time: parsedTime
          };
        });

        this.setData({
          total: res.data.total,
          results: results
        });
      } else {
        wx.showToast({
          title: res.data.message,
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '网络错误，请稍后重试',
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
  },

  addHoursToTime(serverTime, hoursToAdd) {
    // 将字符串时间解析为 Date 对象
    const dateParts = serverTime.split(" ");
    const date = dateParts[0].split(".");
    const time = dateParts[1].split(":");
  
    const year = parseInt(date[0], 10);
    const month = parseInt(date[1], 10) - 1; // JavaScript 中的月份从 0 开始
    const day = parseInt(date[2], 10);
  
    const hour = parseInt(time[0], 10);
    const minute = parseInt(time[1], 10);
    const second = parseInt(time[2], 10);
  
    // 创建 Date 对象
    const dateObj = new Date(year, month, day, hour, minute, second);
  
    // 加上 8 个小时
    dateObj.setHours(dateObj.getHours() + hoursToAdd);
  
    // 格式化为 "YYYY.MM.DD HH:mm:ss"
    const formattedDate = dateObj.getFullYear() +
      "." +
      String(dateObj.getMonth() + 1).padStart(2, "0") +
      "." +
      String(dateObj.getDate()).padStart(2, "0") +
      " " +
      String(dateObj.getHours()).padStart(2, "0") +
      ":" +
      String(dateObj.getMinutes()).padStart(2, "0") +
      ":" +
      String(dateObj.getSeconds()).padStart(2, "0");
  
    return formattedDate;
  },

  viewDetail(e) {
    const { id, detail, comment } = e.currentTarget.dataset;
    
    // 使用全局变量或存储
    const app = getApp();
    app.globalData.detailData = detail;

    wx.navigateTo({
        url: `../detail/detail?id=${id}&comment=${encodeURIComponent(comment)}`
    });
  }
});