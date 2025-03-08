// pages/detect/detect.js
Page({
  data: {
    username: '',
  },
  onLoad(options) {
    const app = getApp()
    const username = app.globalData.username
    this.setData({
      'username': username
    })
  },
  bindViewTakePhoto() {
    wx.navigateTo({
      url: '../camera/camera',
    })
  },
  bindViewRecordVideo() {
    wx.navigateTo({
      url: '../recorder/recorder',
    })
  },

  bindViewUploadPhoto() {
    wx.navigateTo({
      url: '../photo/photo',
    })
  },

  bindViewUploadVideo() {
    const that = this; // 保存上下文
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'], // 仅允许从相册选择
      compressed: true, // 压缩视频
      maxDuration: 70, // 设置视频允许的最大时长
      success(res) {
        const tempFile = res.tempFiles[0];
        console.log(tempFile)
        const tempFilePath = tempFile.tempFilePath; // 视频路径
        const duration = tempFile.duration; // 视频时长（秒）
        const sizeMB = tempFile.size / 1024 / 1024; // 视频大小（MB）

        // 校验时长
        if (duration < 20 || duration > 70) {
          wx.showToast({
            title: '视频时长必须在20-70秒之间',
            icon: 'none',
          });
          return;
        }

        // 校验大小
        if (sizeMB > 50) {
          wx.showToast({
            title: '视频大小不能超过50MB',
            icon: 'none',
          });
          return;
        }

        that.UploadVideo(tempFilePath);
        // wx.navigateTo({
        //     url: `../preview/preview?videoPath=${encodeURIComponent(tempFilePath)}`, // 使用 encodeURIComponent 处理路径
        // });
      },
      fail(err) {
        console.error("用户取消或选择视频失败：", err);
        wx.showToast({
          title: '视频选择失败',
          icon: 'none',
        });
      }
    });
  },

  async UploadVideo(uploadedVideo) {
    if (!uploadedVideo) {
      wx.showToast({
        title: "没有视频可上传",
        icon: "error",
      });
      return;
    }

    const app = getApp(); // 获取全局应用实例
    const username = app.globalData.username;

    // 处理用户名，确保路径合法性
    let username_path = username ? username.replace(/[^a-zA-Z0-9]/g, "") : "";
    if (!username_path) {
      username_path = "defaultUser"; // 如果用户名无效，设置默认用户名
    }

    wx.showLoading({
      title: "上传中...",
    });

    // 使用用户名和时间戳生成唯一文件名
    const timestamp = Date.now(); // 当前时间戳
    const cloudPath = `videos/${username_path}-${timestamp}.mp4`;
    let returnId = -1;

    try {
      // 上传视频到云存储
      const fileID = await new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath, // 云存储路径
          filePath: uploadedVideo, // 本地视频路径
          success: (res) => {
            console.log("视频上传成功：", res);
            resolve(res.fileID); // 上传成功时返回 fileID
          },
          fail: (err) => {
            console.error("视频上传失败：", err);
            wx.showToast({
              title: "视频上传失败",
              icon: "error",
            });
            reject(err); // 上传失败时抛出错误
          },
        });
      });

      console.log("上传成功，文件 fileID: ", fileID);

      // 调用后端检测接口
      const response = await wx.cloud.callContainer({
        config: {
          env: "prod-4ggnzg0z43d1ab28", // 替换为实际的云环境 ID
        },
        path: "/api/detect/detect_by_video", // 后端 API 路径
        header: {
          "X-WX-SERVICE": "django-5dw4", // 替换为实际的服务名
          "content-type": "application/json", // 指定请求类型
        },
        method: "POST",
        data: {
          name: username, // 用户名
          fileID: fileID, // 上传视频的 fileID
        },
      });

      // 检查后端响应结果
      if (response && response.statusCode === 200 && response.data) {
        console.log("后端接口响应:", response.data);

        console.log(response.data)
        if (response.data.id) {
          wx.showToast({
            title: "处理成功",
            icon: "success",
            duration: 2000
          });
          returnId = response.data.id
        } else {
          wx.showToast({
            title: "检测失败，请确保视频中出现完整面部!",
            icon: "none",
            duration: 2000
          });
        }
      } else {
        wx.showToast({
          title: "检测失败!",
          icon: "none",
          duration: 2000
        });
        console.error("后端接口响应异常:", response);
      }
    } catch (err) {
      console.error("发生错误:", err);
      wx.showToast({
        title: "服务器繁忙，请稍后在历史数据中查询检测结果~",
        icon: "none",
        duration: 2000
      });
    } finally {
      setTimeout(() => {
        wx.hideLoading(); // 延迟隐藏加载提示
        if (returnId != -1) {
          wx.navigateTo({
            url: `../rating/rating?id=${returnId}`
          });
        }
      }, 2000);
    }
  },

  bindViewNotice() {
    wx.navigateTo({
      url: '../notice/notice',
    })
  },
})