import * as echarts from '../../components/ec-canvas/echarts';

Page({
  data: {
    username: '',
    motto: '由北京天坛医院和清华大学联合开发\n检测数据仅供参考\n拍摄的照片和视频不会用于其他任何用途',
    results: [], // 历史检测结果
    times: [], // 检测日期
    ec: { // ECharts 配置
      lazyLoad: true // 延迟加载
    }
  },

  onLoad(options) {
    const app = getApp();
    const username = app.globalData.username;

    this.setData({ username });

    // 获取历史结果
    this.fetchHistory();
  },

  onShow(options) {
    const app = getApp();
    const username = app.globalData.username;

    this.setData({ username });

    // 获取历史结果
    this.fetchHistory();
  },

  // 获取历史记录
  async fetchHistory() {
    const app = getApp();
    const name = app.globalData.username;

    wx.showLoading({
      title: '加载中...',
      mask: true
    });

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
          page: 1 // 假设只需要获取第一页数据
        }
      });

      wx.hideLoading(); // 隐藏加载动画

      if (res.data.code === 200) {
        const rawResults = res.data.results;
        const results = rawResults.slice(-10).map(val => {
          if (val.result < 0) return 0;
          if (val.result > 100) return 100;
          return val.result;
        }).reverse();

        const times = rawResults.slice(-10).map(val => {
          const parsedTime = this.addHoursToTime(val.time, 8)
          return parsedTime;
        }).reverse();

        this.setData({ results, times });

        // 初始化图表
        this.initChart();
      }
    } catch (error) {
      wx.hideLoading(); // 隐藏加载动画
      console.error('Failed to fetch history:', error);
      wx.showToast({ title: '加载历史记录失败', icon: 'none' });
    }
  },

  // 初始化图表
  initChart() {
    this.ecComponent = this.selectComponent('#mychart-dom-line');
    this.ecComponent.init((canvas, width, height, dpr) => {
      // 初始化 ECharts 实例
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // 像素比
      });
      this.setChartOptions(chart);
      return chart;
    });
  },

  // 设置图表的配置项
  setChartOptions(chart) {
    const { results, times } = this.data;
    const options = {
      title: {
        text: '最近检测历史',
        left: 'center',
        textStyle: {
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis', // 触发类型为坐标轴
        formatter: function (params) {
          const index = params[0].dataIndex; // 获取当前数据点的索引
          const time = times[index]; // 获取对应的时间
          const value = params[0].value; // 获取对应的分值
          return `检测时间: ${time}\n分值: ${value}`;
        }
      },
      xAxis: {
        type: 'category',
        data: results.map((_, index) => `第${index + 1}次`), // x 轴显示第几次检测
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: '检测分值',
          type: 'line',
          data: results,
          label: {
            show: true,
            position: 'top',
            formatter: '{c}' // 在数据点上显示具体的分值
          },
          itemStyle: {
            color: '#1AAD19' // 线条颜色
          },
          smooth: true // 平滑曲线
        }
      ]
    };

    chart.setOption(options);
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
});