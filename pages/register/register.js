// index.js
Page({
  data: {
    motto: '欢迎使用FPHelper',
    userInfo: {
      username: '',
      password: '',
      confirmPassword: ''
    },
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  async bindViewRegister() {
    const username = this.data.userInfo.username
    const password = this.data.userInfo.password
    const confirmPassword = this.data.userInfo.confirmPassword
    if (username == "") {
      wx.showModal({
        title: '注册失败',
        content: '用户名不能为空'
      })
      return
    }
    if (password.length < 6 || confirmPassword.length < 6) {
      wx.showModal({
        title: '注册失败',
        content: '密码不得短于6个字符'
      })
      return
    }
    if (password != confirmPassword) {
      wx.showModal({
        title: '注册失败',
        content: '请确认两次密码输入一致'
      })
      return
    }
    const res = await wx.cloud.callContainer({
      "config": {
        "env": "prod-4ggnzg0z43d1ab28"
      },
      "path": "/api/user/register",
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
      wx.showModal({
        title: '注册成功',
        content: '欢迎使用FP Helper！',
        complete(res) {
          wx.navigateTo({
            url: '../index/index',
          })
        }
      })
    } else if (code == 400) {
      wx.showModal({
        title: '注册失败',
        content: '用户名已经存在',
      })
    } else {
      wx.showModal({
        title: '注册失败',
        content: '未知错误',
      })
    }
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
  },
  onConfirmPassword(e) {
    const confirmPassword = e.detail.value
    this.setData({
      "userInfo.confirmPassword": confirmPassword,
    })
  }
})