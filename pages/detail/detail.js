Page({
  data: {
    id: "",
    detail: {},
    comment: "",
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
    const { id, comment } = options;

    const app = getApp();
    const detail = app.globalData.detailData;

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
  }
});