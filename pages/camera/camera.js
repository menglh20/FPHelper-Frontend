// pages/camera/camera.js
Page({
  data: {
    filepath: '',
    isRecording: false,
    cameraDirection: 'front',
    hint: '请保持平静，摘掉眼镜，并注视摄像头',
    state: "pic_at_rest",
    photoPath: {
      'pic_at_rest': '',
      'pic_forehead_wrinkle': '',
      'pic_eye_closure': '',
      'pic_smile': '',
      'pic_snarl': '',
      'pic_lip_pucker': '',
    },
    fileID: {
      'pic_at_rest': '',
      'pic_forehead_wrinkle': '',
      'pic_eye_closure': '',
      'pic_smile': '',
      'pic_snarl': '',
      'pic_lip_pucker': '',
    },
    stateOrder: [
      'pic_at_rest',
      'pic_forehead_wrinkle',
      'pic_eye_closure',
      'pic_smile',
      'pic_snarl',
      'pic_lip_pucker'
    ],
    hints: {
      'pic_at_rest': '请保持平静，摘掉眼镜，并注视摄像头',
      'pic_forehead_wrinkle': '请挑起眉毛并注视摄像头',
      'pic_eye_closure': '请轻轻闭上双眼并保持不动',
      'pic_smile': '请露齿微笑并注视摄像头',
      'pic_snarl': '请放大鼻孔并注视摄像头',
      'pic_lip_pucker': '请嘟嘴做出亲吻动作并注视摄像头'
    },
    audioPaths: {
      'pic_at_rest': '/resources/at_rest.mp3',
      'pic_forehead_wrinkle': '/resources/forehead_wrinkle.mp3',
      'pic_eye_closure': '/resources/eye_closure.mp3',
      'pic_smile': '/resources/smile.mp3',
      'pic_snarl': '/resources/snarl.mp3',
      'pic_lip_pucker': '/resources/lip_pucker.mp3',
      'finish': 'resources/finish.mp3'
    }
  },

  playAudio(state) {
    const audioPath = this.data.audioPaths[state]; // 根据状态获取音频路径
    if (!audioPath) {
      console.error('音频路径不存在:', state);
      return;
    }

    if (this.data.audioContext) {
      this.data.audioContext.stop(); // 停止之前的音频
    }

    const innerAudioContext = wx.createInnerAudioContext(); // 创建音频实例
    innerAudioContext.src = audioPath; // 设置音频路径
    innerAudioContext.play(); // 开始播放
    innerAudioContext.onPlay(() => {
      console.log('音频播放中:', audioPath);
    });
    innerAudioContext.onError((err) => {
      console.error('音频播放错误:', err);
    });

    this.setData({
      audioContext: innerAudioContext // 保存音频实例
    });
  },

  // 拍照并切换下一个状态
  bindViewTakePhoto() {
    const { state, photoPath, stateOrder, hints } = this.data;

    // 检查是否已经授权保存到相册
    wx.authorize({
      scope: 'scope.writePhotosAlbum',
      success: () => {
        console.log('已授权保存到相册');
      },
      fail: () => {
        console.log('未授权保存到相册');
      }
    });

    const cameraContext = wx.createCameraContext();
    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        console.log('拍照成功，照片路径为:', res.tempImagePath);

        // 保存到相册
        wx.saveImageToPhotosAlbum({
          filePath: res.tempImagePath,
          success: () => {
            console.log('照片已保存到相册');
            wx.showToast({
              title: '保存到相册成功',
              icon: 'success'
            });

            // 保存路径到 photoPath 对应的 state
            photoPath[state] = res.tempImagePath;
            this.setData({ photoPath });

            // 切换到下一个状态
            const nextIndex = stateOrder.indexOf(state) + 1;
            if (nextIndex < stateOrder.length) {
              const nextState = stateOrder[nextIndex];
              this.setData({
                state: nextState,
                hint: hints[nextState]
              });

              // 播放语音提示
              this.playAudio(nextState);
            } else {
              wx.showToast({
                title: '所有照片拍摄完成',
                icon: 'success'
              });
              this.setData({
                hint: "所有照片已经拍摄完成，请点击上传检测"
              });
              this.playAudio('finish')
            }
          },
          fail: (err) => {
            console.error('保存到相册失败:', err);
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  onLoad() {
    this.playAudio('pic_at_rest')
  },

  // 页面卸载时停止音频
  onUnload() {
    if (this.data.audioContext) {
      this.data.audioContext.stop(); // 停止音频播放
      this.setData({
        audioContext: null // 清空音频实例
      });
    }
  },

  async bindViewUpload() {
    const { photoPath } = this.data;

    // 检查是否所有状态都有对应的照片
    const missingStates = Object.keys(photoPath).filter((key) => !photoPath[key]);
    if (missingStates.length > 0) {
      wx.showToast({
        title: `未拍摄完成: ${missingStates.join(', ')}`,
        icon: 'none'
      });
      return;
    }

    // 显示上传中的提示
    wx.showLoading({
      title: '上传中...',
      mask: true // 设置遮罩，防止用户操作
    });

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
    }
  },

  bindViewReverse() {
    const cameraDirection = this.data.cameraDirection;
    this.setData({
      cameraDirection: cameraDirection === 'back' ? 'front' : 'back'
    });
  },

  bindViewRetake() {
    const { state, stateOrder, photoPath, hints } = this.data;

    // 找到当前状态的索引
    const currentIndex = stateOrder.indexOf(state);
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevState = stateOrder[prevIndex];

      // 清空上一张照片的路径
      photoPath[prevState] = '';
      this.setData({
        state: prevState,
        photoPath,
        hint: hints[prevState],
        isAllCompleted: false // 重新拍摄则标志未完成
      });

      // 播放语音提示
      this.playAudio(prevState);

      wx.showToast({
        title: '请重新拍摄上一张照片',
        icon: 'none'
      });
    } else {
      wx.showToast({
        title: '没有可以重新拍摄的照片',
        icon: 'none'
      });
    }
  },

  cameraPermissionFailed() {
    wx.showModal({
      title: '录制失败',
      content: '录制视频需要相机权限',
    });
  }
});
