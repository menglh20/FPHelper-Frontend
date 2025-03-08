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
    const missingFields = Object.keys(photoPath).filter((key) => !photoPath[key]);
    if (missingFields.length > 0) {
      wx.showToast({
        title: '请上传所有图片',
        icon: 'none'
      });
      return;
    }

    // 上传所有照片
    const app = getApp();
    // 从全局数据中获取 username
    const username = app.globalData.username;
    let username_path = username.replace(/[^a-zA-Z0-9]/g, "");
    if (!username_path) {
      username_path = "defaultUser"; // 设置默认用户名
    }
    const suffix = username_path + Date.now();

    const fileID = {};
    let returnId = -1;

    try {
      // 上传任务并行处理
      const uploadTasks = Object.entries(photoPath).map(([state, path]) => {
        return wx.cloud.uploadFile({
          cloudPath: `${state}_${suffix}.jpg`, // 云存储路径
          filePath: path,
          config: {
            'env': 'prod-4ggnzg0z43d1ab28' // 云开发环境配置
          }
        }).then(res => {
          console.log(`${state} 上传成功，文件 ID:`, res.fileID);
          // 更新 fileID 对象
          fileID[state] = res.fileID;
          return { state, fileID: res.fileID }; // 返回成功结果
        }).catch(err => {
          console.error(`${state} 上传失败:`, err);
          return { state, error: err }; // 返回失败结果
        });
      });

      // 等待所有上传任务完成
      const results = await Promise.all(uploadTasks);

      // 检查是否有上传失败的照片
      const failed = results.filter(item => item.error);
      if (failed.length > 0) {
        wx.hideLoading(); // 隐藏加载提示
        wx.showToast({
          title: `部分上传失败: ${failed.map(f => f.state).join(', ')}`,
          icon: 'none'
        });
        return; // 不再继续调用后端接口
      }

      wx.showToast({
        title: '所有照片上传成功',
        icon: 'success'
      });

      // 所有照片上传成功后，调用后端接口
      const response = await wx.cloud.callContainer({
        "config": {
          "env": "prod-4ggnzg0z43d1ab28"
        },
        "path": "/api/detect/detect",
        "header": {
          "X-WX-SERVICE": "django-5dw4",
          "content-type": "application/json"
        },
        "method": "POST",
        "data": {
          "name": username,
          "fileID": fileID // 上传完成的 fileID 对象
        }
      });

      console.log('后端接口响应:', response);
      returnId = response.data.id;
      wx.showToast({
        title: '后端处理成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('调用后端接口失败:', err);
      wx.showToast({
        title: '后端处理失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading(); // 无论成功或失败，隐藏加载提示
      if (returnId == -1) {
        wx.navigateBack();
      } else {
        wx.navigateTo({
          url: `../rating/rating?id=${returnId}`
        });
      }
    }
  },
});