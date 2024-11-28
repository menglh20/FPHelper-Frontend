// index.js
Page({
  data: {
    motto: '欢迎使用FPHelper',
    userInfo: {
      username: '',
      password: '',
    },
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  async bindViewLogin() {
    const username = this.data.userInfo.username
    const password = this.data.userInfo.password
    if (username == "" || password.length == "") {
      wx.showModal({
        title: '登陆失败',
        content: '用户名或者密码不能为空'
      })
      return
    }
    const res = await wx.cloud.callContainer({
      "config": {
        "env": "prod-4ggnzg0z43d1ab28"
      },
      "path": "/api/user/login",
      "header": {
        "X-WX-SERVICE": "django-5dw4",
        "content-type": "application/json"
      },
      "method": "POST",
      "data": {
        "name": username,
        "password": password
      }
    })
    console.log(res)
    const code = res.data.code
    if (code == 200) {
      const app = getApp()
      app.globalData.username = username
      wx.navigateTo({
        url: '../main/main',
      })
    } else {
      wx.showModal({
        title: '登录失败',
        content: '用户名和密码不正确'
      })
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