// pages/preview/preview.js
Page({
  data: {
    uploadedVideo: '', // 用于存储传递过来的视频路径
  },
  onLoad(options) {
    // 从页面路径中获取参数
    const videoPath = decodeURIComponent(options.videoPath); // 解码视频路径
    this.setData({
      uploadedVideo: videoPath, // 将视频路径存储到 data 中供页面使用
    });
  },
  async UploadVideo() {
    const { uploadedVideo } = this.data; // 从页面的 data 中获取视频路径

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
        console.log("后端接口响应成功:", response.data);
        wx.showToast({
          title: "处理成功",
          icon: "success",
        });

        // 如果需要，可以将后端返回的结果显示到页面
        console.log(response.data)
        returnId = response.data.id
      } else {
        console.error("后端接口响应异常:", response);
        wx.showToast({
          title: "后端处理失败",
          icon: "none",
        });
      }
    } catch (err) {
      console.error("发生错误:", err);
      wx.showToast({
        title: "上传或处理失败",
        icon: "none",
      });
    } finally {
      wx.hideLoading(); // 隐藏加载提示
      if (returnId == -1) {
        wx.navigateBack();
      } else {
        wx.navigateTo({
          url: `../rating/rating?id=${returnId}`
        });
      }
    }
  },
  Back() {
    wx.navigateBack();
  }
});