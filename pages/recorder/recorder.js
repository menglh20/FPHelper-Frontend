Page({
  data: {
    devicePosition: "front", // 相机方向，默认为前置
    isRecording: false, // 是否正在录制
    showVideoPreview: false, // 是否显示视频预览
    videoSrc: "", // 视频文件路径
    recordingTime: 0, // 当前录制的时间（单位：秒）
    formattedTime: "00:00", // 格式化后的时间显示
    fileID: "", // 用于存储上传到云存储后的 fileID
    textPrompt: "", // 当前的文字提示
  },

  audioContext: null, // 音频上下文
  recordingTimer: null, // 录制时间计时器

  // 切换相机方向
  toggleCamera() {
    this.setData({
      devicePosition: this.data.devicePosition === "front" ? "back" : "front",
    });
  },

  // 开始录制视频
  startRecording() {
    const cameraContext = wx.createCameraContext(); // 获取相机上下文
    this.cameraContext = cameraContext;

    this.setData({
      isRecording: true,
      recordingTime: 0, // 重置录制时间
      formattedTime: "00:00", // 重置时间显示
      textPrompt: "请保持平静，摘掉眼镜，并注视摄像头", // 初始文字提示
    });

    // 初始化音频上下文
    this.audioContext = wx.createInnerAudioContext();

    // 播放录制开始的语音提示
    this.playAudio("resources/at_rest.mp3");

    // 开始录制
    cameraContext.startRecord({
      timeout: 65,
      timeoutCallback: () => {
        this.stopRecording(); // 如果录制超时，自动停止
      },
    });

    // 启动定时器更新录制时间
    this.recordingTimer = setInterval(() => {
      const newRecordingTime = this.data.recordingTime + 1;

      this.setData({
        recordingTime: newRecordingTime,
        formattedTime: this.formatTime(newRecordingTime),
      });

      // 每10秒更新文字提示和语音播报
      this.updatePromptAndAudio(newRecordingTime);

      // 如果录制时间达到 60 秒，自动停止录制
      if (newRecordingTime >= 60) {
        this.stopRecording();
      }
    }, 1000); // 每秒更新一次时间
  },

  // 停止录制并保存
  stopRecording() {
    if (!this.data.isRecording) return;

    // 停止录制
    this.cameraContext.stopRecord({
      success: (res) => {
        this.setData({
          videoSrc: res.tempVideoPath, // 获取录制的视频路径
          isRecording: false,
          showVideoPreview: true, // 显示视频预览界面
        });

        // 尝试保存视频到相册
        this.saveVideoToAlbum(res.tempVideoPath);
      },
      fail: (err) => {
        console.error("停止录制失败：", err);
        this.setData({ isRecording: false });
      },
    });

    // 停止计时器和音频
    this.clearTimersAndAudio();

    // 播放录制完成的语音
    this.playAudio("resources/finish_video.mp3");

    // 更新提示文字
    this.setData({
      textPrompt: "视频已经拍摄完成，请点击上传检测",
    });
  },

  // 保存视频到相册
  saveVideoToAlbum(videoPath) {
    const that = this;

    // 检查保存到相册的权限
    wx.getSetting({
      success(res) {
        if (res.authSetting["scope.writePhotosAlbum"]) {
          // 用户已授权保存到相册
          that.performSaveVideo(videoPath);
        } else if (res.authSetting["scope.writePhotosAlbum"] === undefined) {
          // 第一次请求授权
          wx.authorize({
            scope: "scope.writePhotosAlbum",
            success() {
              // 授权成功
              that.performSaveVideo(videoPath);
            },
            fail() {
              // 授权失败，引导用户打开设置页面
              wx.showModal({
                title: "提示",
                content: "请授权保存视频到相册",
                success(modalRes) {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                },
              });
            },
          });
        } else {
          // 用户之前拒绝授权，引导用户打开设置页面
          wx.showModal({
            title: "提示",
            content: "请授权保存视频到相册",
            success(modalRes) {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            },
          });
        }
      },
    });
  },

  // 执行保存视频操作
  performSaveVideo(videoPath) {
    wx.saveVideoToPhotosAlbum({
      filePath: videoPath,
      success() {
        wx.showToast({
          title: "视频已保存到相册",
          icon: "success",
        });
      },
      fail(err) {
        console.error("保存视频失败：", err);
        wx.showToast({
          title: "保存失败",
          icon: "error",
        });
      },
    });
  },

  // 重新录制
  restartRecording() {
    this.setData({
      showVideoPreview: false,
      videoSrc: "",
      recordingTime: 0,
      formattedTime: "00:00",
    });
  },

  // 上传视频
  async uploadVideo() {
    const { videoSrc } = this.data;

    if (!videoSrc) {
      wx.showToast({
        title: "没有视频可上传",
        icon: "error",
      });
      return;
    }

    const app = getApp(); // 获取全局应用实例
    const username = app.globalData.username;
    let username_path = username.replace(/[^a-zA-Z0-9]/g, "");
    if (!username_path) {
      username_path = "defaultUser"; // 设置默认用户名
    }

    wx.showLoading({
      title: "上传中...",
    });

    // 使用用户名 + 时间戳命名文件
    const timestamp = Date.now(); // 当前时间戳
    const cloudPath = `videos/${username_path}-${timestamp}.mp4`;

    try {
      // 将 wx.cloud.uploadFile 封装成 Promise
      const fileID = await new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath, // 云存储路径
          filePath: videoSrc, // 本地视频路径
          success: (res) => {
            console.log("上传成功：", res);
            resolve(res.fileID); // 成功时返回 fileID
          },
          fail: (err) => {
            console.error("上传失败：", err);
            wx.showToast({
              title: "上传失败",
              icon: "error",
            });
            reject(err); // 失败时抛出错误
          },
        });
      });

      console.log("文件的 fileID: ", fileID);

      // 调用后端接口
      const response = await wx.cloud.callContainer({
        config: {
          env: "prod-4ggnzg0z43d1ab28",
        },
        path: "/api/detect/detect_by_video",
        header: {
          "X-WX-SERVICE": "django-5dw4",
          "content-type": "application/json",
        },
        method: "POST",
        data: {
          name: username,
          fileID: fileID,
        },
      });

      console.log("后端接口响应:", response);
      wx.showToast({
        title: "后端处理成功",
        icon: "success",
      });
    } catch (err) {
      console.error("错误:", err);
      wx.showToast({
        title: "上传或后端处理失败",
        icon: "none",
      });
    } finally {
      wx.hideLoading(); // 无论成功或失败，隐藏加载提示
    }
  },

  // 更新文字提示和语音播报
  updatePromptAndAudio(recordingTime) {
    let prompt = "";
    let audioPath = "";

    // 根据时间线更新语音和提示
    switch (recordingTime) {
      case 10:
        prompt = "请挑起眉毛并注视摄像头";
        audioPath = "resources/forehead_wrinkle.mp3";
        break;
      case 20:
        prompt = "请轻轻闭上双眼并保持不动";
        audioPath = "resources/eye_closure.mp3";
        break;
      case 30:
        prompt = "请露齿微笑并注视摄像头";
        audioPath = "resources/smile.mp3";
        break;
      case 40:
        prompt = "请用力呲牙，露出上牙齿，并注视摄像头";
        audioPath = "resources/snarl.mp3";
        break;
      case 50:
        prompt = "请嘟嘴做出亲吻动作并注视摄像头";
        audioPath = "resources/lip_pucker.mp3";
        break;
      case 17:
      case 27:
      case 37:
      case 47:
      case 57:
        prompt = "请放松";
        audioPath = "resources/relax.mp3"
        break;
    }

    if (prompt && audioPath) {
      this.setData({
        textPrompt: prompt, // 更新文字提示
      });
      this.playAudio(audioPath); // 播放语音提示
    }
  },

  // 播放语音提示
  playAudio(audioPath) {
    if (!this.audioContext) {
      this.audioContext = wx.createInnerAudioContext();
    }

    this.audioContext.src = audioPath; // 设置音频路径
    this.audioContext.play(); // 播放音频
  },

  // 时间格式化函数
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  },

  // 清除计时器和音频播放
  clearTimersAndAudio() {
    // 清除计时器
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    // 停止音频播放
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy(); // 销毁音频上下文
      this.audioContext = null;
    }
  },

  // 页面卸载时触发
  /**
   * 当页面卸载时调用此方法。
   * 它负责清除计时器和音频播放，以确保在页面关闭或导航离开时不会留下悬挂的资源。
   * 这对于维护应用的性能和避免内存泄漏至关重要。
   */
  onUnload() {
    // 清除计时器和音频播放
    this.clearTimersAndAudio();
  },
});