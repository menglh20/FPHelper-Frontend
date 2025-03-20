// pages/photo/photo.js
Page({
  data: {
    // 图片路径对象
    photoPath: {
      pic_at_rest: '',
      pic_forehead_wrinkle: '',
      pic_eye_closure: '',
      pic_smile: '',
      pic_snarl: '',
      pic_lip_pucker: '',
    },
    // 用于动态绑定 WXML 的键列表
    photoKeys: [
      'pic_at_rest',
      'pic_forehead_wrinkle',
      'pic_eye_closure',
      'pic_smile',
      'pic_snarl',
      'pic_lip_pucker',
    ],
    // 图片对应的描述标签
    imageLabels: {
      pic_at_rest: '静态表情',
      pic_forehead_wrinkle: '挑眉',
      pic_eye_closure: '轻闭眼',
      pic_smile: '露齿微笑',
      pic_snarl: '呲牙',
      pic_lip_pucker: '撅嘴',
    }
  },

  // 选择图片
  chooseImage(e) {
    const key = e.currentTarget.dataset.key; // 获取点击上传框的键名
    wx.chooseMedia({
      count: 1, // 每次只能选择一张图片
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath; // 获取临时文件路径
        const photoPath = this.data.photoPath;
        photoPath[key] = tempFilePath; // 将图片路径存入对应字段
        this.setData({ photoPath }); // 更新数据
      }
    });
  },

  // 上传检测
  async upload() {
    const { photoPath } = this.data;

    // 校验是否所有字段都有值
    const missingFields = Object.keys(photoPath).filter(key => !photoPath[key]);
    if (missingFields.length > 0) {
      wx.showToast({
        title: '请上传所有图片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '上传中...',
      mask: true
    });

    try {
      const disabledSide = await this.chooseSide();
      const selfish = await this.chooseAngle();

      // 上传所有照片
      const fileIDs = await this.uploadPhotos(photoPath);
      if (!fileIDs) return; // 处理上传失败

      // 所有照片上传成功后，调用后端接口
      await this.callBackendApi(fileIDs, disabledSide, selfish);
    } catch (err) {
      console.error('上传或处理失败:', err);
      wx.showToast({
        title: '处理失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  async chooseSide() {
    return new Promise(resolve => {
      wx.showModal({
        title: '请选择',
        content: '您的面瘫侧是',
        cancelText: "左侧",
        confirmText: "右侧",
        success: res => {
          resolve(res.confirm ? "right" : "left");
        }
      });
    });
  },

  async chooseAngle() {
    return new Promise(resolve => {
      wx.showModal({
        title: '请选择',
        content: '您的拍摄角度是',
        cancelText: "自拍",
        confirmText: "他人拍摄",
        success: res => {
          resolve(res.confirm ? 0 : 1);
        }
      });
    });
  },

  async uploadPhotos(photoPath) {
    const app = getApp();
    const username = app.globalData.username || "defaultUser";
    const suffix = username.replace(/[^a-zA-Z0-9]/g, "") + Date.now();

    try {
      const uploadTasks = Object.entries(photoPath).map(([state, path]) => {
        return wx.cloud.uploadFile({
          cloudPath: `${state}_${suffix}.jpg`,
          filePath: path,
          config: { 'env': 'prod-4ggnzg0z43d1ab28' }
        });
      });

      const results = await Promise.all(uploadTasks);
      const fileIDs = results.reduce((acc, res, index) => {
        acc[Object.keys(photoPath)[index]] = res.fileID;
        return acc;
      }, {});

      // wx.showToast({ title: '照片上传成功', icon: 'success' });
      return fileIDs;
    } catch (err) {
      wx.showToast({ title: '部分上传失败', icon: 'none' });
      console.error("上传错误:", err);
      return null;
    }
  },

  async callBackendApi(fileIDs, disabledSide, selfish) {
    const app = getApp();
    const username = app.globalData.username;
    const response = await wx.cloud.callContainer({
      "config": { "env": "prod-4ggnzg0z43d1ab28" },
      "path": "/api/detect/detect",
      "header": {
        "X-WX-SERVICE": "django-5dw4",
        "content-type": "application/json"
      },
      "method": "POST",
      "data": {
        "name": username,
        "fileID": fileIDs,
        "disabledSide": disabledSide,
        "selfish": selfish
      }
    });

    console.log('后端接口响应:', response);
    if (response.data.id === -1) {
      wx.navigateBack();
    } else {
      wx.navigateTo({
        url: `../rating/rating?id=${response.data.id}`
      });
    }
    wx.showToast({
      title: '后端处理成功',
      icon: 'success'
    });
  }
});