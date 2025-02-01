Page({

  data: {
    id: "",
    detail: {},
    comment: "",
    inputs: {
      'rest symmetry': {},
      'voluntary symmetry': {},
      synkinesis: {}
    },
    originalTotalScore: 0,
    calculatedTotalScore: 0
  },

  onLoad(options) {
    const { id, comment } = options;

    // 获取全局变量
    const app = getApp();
    const detail = app.globalData.detailData;

    // 解析 comment
    let parsedInputs = {
      'rest symmetry': {},
      'voluntary symmetry': {},
      synkinesis: {}
    };

    let calculatedTotalScore = 0; // 初始化的计算后总分

    if (comment && comment !== "null") { // 确保 comment 存在且有效
      try {
        parsedInputs = JSON.parse(decodeURIComponent(comment)); // 解析 JSON 字符串

        // 如果 comment 有效，根据解析的 inputs 计算总分
        calculatedTotalScore = this.calculateTotalScoreBasedOnInputs(parsedInputs);
      } catch (error) {
        console.error('解析 comment 失败:', error);
        wx.showToast({
          title: '无效的评论数据',
          icon: 'error',
          duration: 2000
        });
      }
    }

    // 计算原始总分
    const originalTotalScore = this.calculateTotalScore(detail);

    this.setData({
      id,
      detail,
      comment: decodeURIComponent(comment),
      inputs: parsedInputs, // 初始化 inputs
      originalTotalScore,
      calculatedTotalScore // 初始化计算后总分
    });
  },

  onInputChange(e) {
    const { group, key } = e.currentTarget.dataset;
    const value = e.detail.value;

    // 更新 inputs 数据
    this.setData({
      [`inputs.${group}.${key}`]: value
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

    // 定义需要检查的字段
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

    // 遍历所有字段，检查是否存在空值
    for (let field of requiredFields) {
      const value = inputs[field.group]?.[field.key];
      if (value == null || value === "") {
        return false; // 如果任意字段为空，返回 false
      }
    }

    return true; // 如果所有字段都有值，返回 true
  },

  // 上传评论到后端
  uploadComment() {
    const { id, inputs } = this.data;

    // 检查字段是否完整
    if (!this.isInputsComplete()) {
      wx.showToast({
        title: '请填写完整所有字段',
        icon: 'none',
        duration: 2000
      });
      return; // 阻止上传
    }

    // 将 inputs 转换为 JSON 字符串
    const commentString = JSON.stringify(inputs);

    // 调用后端接口上传数据
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