// index.js
Page({
  data: {
    motto: '由北京天坛医院和清华大学联合开发',
    userInfo: {
      username: '',
      password: '',
    },
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  async bindViewLogin() {
    const username = this.data.userInfo.username;
    const password = this.data.userInfo.password;
  
    // 检查用户名和密码是否为空
    if (username == "" || password == "") {
      wx.showModal({
        title: '登录失败',
        content: '用户名或者密码不能为空',
        showCancel: false // 只显示确认按钮
      });
      return; // 终止函数执行
    }
  
    // 调用云函数进行登录
    try {
      const res = await wx.cloud.callContainer({
        config: {
          env: "prod-4ggnzg0z43d1ab28"
        },
        path: "/api/user/login",
        header: {
          "X-WX-SERVICE": "django-5dw4",
          "content-type": "application/json"
        },
        method: "POST",
        data: {
          name: username,
          password: password
        }
      });
  
      console.log(res); // 打印服务器返回的数据，便于调试
  
      const code = res.data.code;
  
      if (code == 200) {
        const app = getApp();
        app.globalData.username = username;
  
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000 // 显示 2 秒
        });
  
        // 登录成功后跳转到主页面 (tabBar 页面)
        wx.switchTab({
          url: '/pages/main/main', // 确保路径正确
        });
      } else {
        wx.showModal({
          title: '登录失败',
          content: '用户名或密码不正确',
          showCancel: false // 只显示确认按钮
        });
      }
    } catch (error) {
      console.error("登录请求失败", error);
      wx.showModal({
        title: '登录失败',
        content: '网络错误，请稍后重试',
        showCancel: false // 只显示确认按钮
      });
    }
  },
  bindViewRegister() {
    wx.navigateTo({
      url: '../register/register'
    })
  },
  onInputUsername(e) {
    const username = e.detail.value
    this.setData({
      "userInfo.username": username,
    })
  },
  onInputPassword(e) {
    const password = e.detail.value
    this.setData({
      "userInfo.password": password,
    })
  }
})