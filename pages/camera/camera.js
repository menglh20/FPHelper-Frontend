// pages/camera/camera.js
Page({
  data: {
    filepath: '',
    isRecording: false,
    cameraDirection: 'back',
    hint: '请保持平静，摘掉眼镜，并注视摄像头',
    state: "pic_at_rest",
    photoPath: {
      'pic_at_rest': '',
      'pic_forehead_wrinkle': '',
      'pic_eye_closure': '',
      'pic_smile': '',
      'pic_snarl': '',
      'pic_lip_pucker': '',
    }, // 拍照后的临时路径
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
    }
  },

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
            } else {
              wx.showToast({
                title: '所有照片拍摄完成',
                icon: 'success'
              });
              this.setData({
                hint: "所有照片已经拍摄完成，请点击上传检测"
              })
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

    // 上传所有照片
    const app = getApp()
    const username = app.globalData.username
    const suffix = username + Date.now()
    const _this = this
    const uploadTasks = Object.entries(photoPath).map(([state, path]) => {
      return wx.cloud.uploadFile({
        cloudPath: `${state}_${suffix}.jpg`, // 云存储路径
        filePath: path,
        config: {
          'env': 'prod-4ggnzg0z43d1ab28'
        }
      }).then(res => {
        console.log(`${state} 上传成功，文件 ID:`, res.fileID);
        const updated_fileid = _this.data.fileID
        updated_fileid[state] = res.fileID
        _this.setData({
          'fileID': updated_fileid
        })
        return { state, fileID: res.fileID };
      }).catch(err => {
        console.error(`${state} 上传失败:`, err);
        return { state, error: err };
      });
    });

    Promise.all(uploadTasks).then(results => {
      const failed = results.filter(item => item.error);
      if (failed.length > 0) {
        wx.showToast({
          title: `部分上传失败: ${failed.map(f => f.state).join(', ')}`,
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: '所有照片上传成功',
          icon: 'success'
        });
      }
    });

    const fileID = _this.data.fileID
    const res = await wx.cloud.callContainer({
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
        "fileID": fileID
      }
    })
    console.log(res)

  },

  bindViewReverse() {
    const cameraDirection = this.data.cameraDirection;
    this.setData({
      cameraDirection: cameraDirection === 'back' ? 'front' : 'back'
    });
  },

  cameraPermissionFailed() {
    wx.showModal({
      title: '录制失败',
      content: '录制视频需要相机权限',
    });
  }
});
