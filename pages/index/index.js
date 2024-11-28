// index.js
Page({
    data: {
        motto: 'Welcome to FPHelper',
        userInfo: {
            username: '',
            password: '',
        },
        loginSuccess: false,
        canIUseGetUserProfile: wx.canIUse('getUserProfile'),
        canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    },
    bindViewTap() {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },
    async bindViewLogin() {
        const username = this.data.userInfo.username
        const password = this.data.userInfo.password
        console.log(username)
        console.log(password)
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
        console.log(code)
        if(code == 200) {
            this.setData({
                "loginSuccess": true
            })
        }
    },
    bindViewRegister() {

    },
    onChooseAvatar(e) {
        const { avatarUrl } = e.detail
        this.setData({
            "userInfo.avatarUrl": avatarUrl,
        })
        console.log(avatarUrl)
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