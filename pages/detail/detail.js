Page({
  data: {
    id: "",
    detail: {},
    comment: "",
    type: "",
    fileId: "",
    hinttext: "",
    inputs: {
      'rest symmetry': {
        'eye': 0,
        'cheek': 0,
        'mouth': 0
      },
      'voluntary symmetry': {
        'forehead wrinkle': 5,
        'eye closure': 5,
        'smile': 5,
        'snarl': 5,
        'lip pucker': 5,
      },
      synkinesis: {
        'forehead wrinkle': 0,
        'eye closure': 0,
        'smile': 0,
        'snarl': 0,
        'lip pucker': 0,
      }
    },
    originalTotalScore: 0,
    calculatedTotalScore: 0,

    // 定义下拉框的可选项
    pickerOptions: {
      'rest symmetry': {
        eye: [0, 1],
        cheek: [0, 1, 2],
        mouth: [0, 1]
      },
      'voluntary symmetry': {
        'forehead wrinkle': [1, 2, 3, 4, 5],
        'eye closure': [1, 2, 3, 4, 5],
        smile: [1, 2, 3, 4, 5],
        snarl: [1, 2, 3, 4, 5],
        'lip pucker': [1, 2, 3, 4, 5]
      },
      synkinesis: {
        'forehead wrinkle': [0, 1, 2, 3],
        'eye closure': [0, 1, 2, 3],
        smile: [0, 1, 2, 3],
        snarl: [0, 1, 2, 3],
        'lip pucker': [0, 1, 2, 3]
      }
    }
  },

  onLoad(options) {
    const { id, comment, type, fileId } = options;

    const app = getApp();
    const detail = app.globalData.detailData;

    console.log(type)
    console.log(fileId)

    let hinttext = "";
    if (type == "image") {
      hinttext = "查看图片";
    } else {
      hinttext = "查看视频";
    }

    let parsedInputs = {
      'rest symmetry': {},
      'voluntary symmetry': {},
      synkinesis: {}
    };

    let calculatedTotalScore = 0; // 初始化的计算后总分

    if (comment && comment !== "null") {
      try {
        parsedInputs = JSON.parse(decodeURIComponent(comment));
        calculatedTotalScore = this.calculateTotalScoreBasedOnInputs(parsedInputs);
      } catch (error) {
        console.error('解析 comment 失败:', error);
        wx.showToast({
          title: '无效的评论数据',
          icon: 'error',
          duration: 2000
        });
      }
      const originalTotalScore = this.calculateTotalScore(detail);

      this.setData({
        id,
        detail,
        comment: decodeURIComponent(comment),
        type,
        fileId,
        hinttext,
        inputs: parsedInputs,
        originalTotalScore,
        calculatedTotalScore
      });
    } else {
      const originalTotalScore = this.calculateTotalScore(detail);
      calculatedTotalScore = 100
      this.setData({
        id,
        detail,
        comment: decodeURIComponent(comment),
        originalTotalScore,
        calculatedTotalScore
      });
    }


  },

  // 监听下拉框变化
  onPickerChange(e) {
    const { group, key } = e.currentTarget.dataset;
    const valueIndex = e.detail.value;
    const selectedValue = this.data.pickerOptions[group][key][valueIndex];

    // 更新 inputs 数据
    this.setData({
      [`inputs.${group}.${key}`]: selectedValue
    });

    // 重新计算输入后的总分
    this.calculateInputTotalScore();
  },

  calculateTotalScore(detail) {
    const voluntarySymmetryScore = this.sumValues(detail['voluntary symmetry']);
    const restSymmetryScore = this.sumValues(detail['rest symmetry']);
    const synkinesisScore = this.sumValues(detail['synkinesis']);
    return 4 * voluntarySymmetryScore - 5 * restSymmetryScore - synkinesisScore;
  },

  calculateTotalScoreBasedOnInputs(inputs) {
    const voluntarySymmetryScore = this.sumNestedValues(inputs['voluntary symmetry']);
    const restSymmetryScore = this.sumNestedValues(inputs['rest symmetry']);
    const synkinesisScore = this.sumNestedValues(inputs['synkinesis']);
    return 4 * voluntarySymmetryScore - 5 * restSymmetryScore - synkinesisScore;
  },

  calculateInputTotalScore() {
    const { inputs } = this.data;

    const voluntarySymmetryScore = this.sumNestedValues(inputs['voluntary symmetry']);
    const restSymmetryScore = this.sumNestedValues(inputs['rest symmetry']);
    const synkinesisScore = this.sumNestedValues(inputs['synkinesis']);

    const calculatedTotalScore = 4 * voluntarySymmetryScore - 5 * restSymmetryScore - synkinesisScore;

    this.setData({ calculatedTotalScore });
  },

  sumValues(data) {
    return Object.values(data).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  },

  sumNestedValues(data) {
    if (!data) return 0;
    return Object.values(data).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  },

  // 检查 inputs 是否完整
  isInputsComplete() {
    const { inputs } = this.data;

    const requiredFields = [
      { group: 'rest symmetry', key: 'eye' },
      { group: 'rest symmetry', key: 'cheek' },
      { group: 'rest symmetry', key: 'mouth' },
      { group: 'voluntary symmetry', key: 'forehead wrinkle' },
      { group: 'voluntary symmetry', key: 'eye closure' },
      { group: 'voluntary symmetry', key: 'smile' },
      { group: 'voluntary symmetry', key: 'snarl' },
      { group: 'voluntary symmetry', key: 'lip pucker' },
      { group: 'synkinesis', key: 'forehead wrinkle' },
      { group: 'synkinesis', key: 'eye closure' },
      { group: 'synkinesis', key: 'smile' },
      { group: 'synkinesis', key: 'snarl' },
      { group: 'synkinesis', key: 'lip pucker' }
    ];

    for (let field of requiredFields) {
      const value = inputs[field.group]?.[field.key];
      if (value == null || value === "") {
        return false;
      }
    }

    return true;
  },

  uploadComment() {
    const { id, inputs } = this.data;

    if (!this.isInputsComplete()) {
      wx.showToast({
        title: '请填写完整所有字段',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const commentString = JSON.stringify(inputs);

    wx.cloud.callContainer({
      config: {
        env: "prod-4ggnzg0z43d1ab28"
      },
      path: "/api/detect/comment",
      header: {
        "X-WX-SERVICE": "django-5dw4",
        "content-type": "application/json"
      },
      method: "POST",
      data: {
        id: id,
        comment: commentString
      },
      success: (res) => {
        wx.showToast({
          title: '评论上传成功',
          icon: 'success',
          duration: 2000
        });
        console.log('上传成功:', res);
      },
      fail: (err) => {
        wx.showToast({
          title: '上传失败',
          icon: 'error',
          duration: 2000
        });
        console.error('上传失败:', err);
      }
    });
  },

  Preview() {
    const { type, fileId } = this.data;
    if (!fileId) {
      wx.showToast({
        title: '暂时不支持预览！',
        icon: 'error',
        duration: 2000
      })
    } else {
      if (type == "image") {
        this.previewImage(fileId);
      } else {
        this.previewVideo(fileId);
      }
    }

  },

  previewImage(fileId) {
    const correctedFileId = fileId.replace(/'/g, '"');
    const fileIdDict = JSON.parse(correctedFileId);
    const { pic_forehead_wrinkle, pic_at_rest, pic_snarl, pic_eye_closure, pic_smile, pic_lip_pucker } = fileIdDict;

    // 调用微信云开发的 getTempFileURL 接口，获取图片临时访问地址
    wx.cloud.getTempFileURL({
      fileList: [pic_forehead_wrinkle, pic_at_rest, pic_snarl, pic_eye_closure, pic_smile, pic_lip_pucker],
      success: res => {
        const fileList = res.fileList;

        // 判断是否成功获取到图片临时地址
        if (fileList && fileList.length > 0) {
          const urls = fileList.map(file => file.tempFileURL); // 获取对应的临时访问 URL

          // 使用 wx.previewImage 预览图片
          wx.previewImage({
            urls: urls, // 传入图片的 URL 列表
            current: urls[0], // 默认预览第一张图片
            success: () => {
              console.log('图片预览成功');
            },
            fail: err => {
              console.error('图片预览失败', err);
            }
          });
        } else {
          console.error('未能获取到图片的临时 URL');
        }
      },
      fail: err => {
        console.error('获取图片临时 URL 失败', err);
      }
    });
  },

  previewVideo(fileId) {
    wx.cloud.getTempFileURL({
      fileList: [fileId], // 传入文件的 fileId（微信云存储中的资源 ID）
      success: res => {
        const fileList = res.fileList;
        if (fileList && fileList.length > 0) {
          const tempFileURL = fileList[0].tempFileURL; // 获取到临时访问地址

          // 使用 wx.previewMedia 预览视频
          wx.previewMedia({
            sources: [
              {
                url: tempFileURL, // 视频的临时访问地址
                type: 'video'    // 资源类型，指定为视频
              }
            ],
            success() {
              console.log('视频预览成功');
            },
            fail(err) {
              console.error('视频预览失败', err);
            }
          });
        } else {
          console.error('未能获取到视频的临时 URL');
        }
      },
      fail: err => {
        console.error('获取视频临时 URL 失败', err);
      }
    });
  }
});