// pages/rating/rating.js
Page({

  data: {
    id: "",
    dropdownOptions: {
      "rest symmetry": {
        eye: ["0", "1"], // 眼对应的下拉选项
        cheek: ["0", "1", "2"], // 鼻唇沟对应的下拉选项
        mouth: ["0",  "1"], // 嘴对应的下拉选项
      },
      "voluntary symmetry": {
        "forehead wrinkle": ["1", "2", "3", "4", "5"],
        "eye closure": ["1", "2", "3", "4", "5"],
        smile: ["1", "2", "3", "4", "5"],
        snarl: ["1", "2", "3", "4", "5"],
        "lip pucker": ["1", "2", "3", "4", "5"],
      },
      synkinesis: {
        "forehead wrinkle": ["0", "1", "2", "3"],
        "eye closure": ["0", "1", "2", "3"],
        smile: ["0", "1", "2", "3"],
        snarl: ["0", "1", "2", "3"],
        "lip pucker": ["0", "1", "2", "3"],
      },
    },
    selectedValues: {
      "rest symmetry": {
        eye: 0, // 默认选中第一个选项
        cheek: 0,
        mouth: 0,
      },
      "voluntary symmetry": {
        "forehead wrinkle": 4,
        "eye closure": 4,
        smile: 4,
        snarl: 4,
        "lip pucker": 4,
      },
      synkinesis: {
        "forehead wrinkle": 0,
        "eye closure": 0,
        smile: 0,
        snarl: 0,
        "lip pucker": 0,
      },
    },
    calculatedTotalScore: 0
  },

  onLoad(options) {
    const { id } = options;

    let calculatedTotalScore = 100; // 初始化的计算后总分

    this.setData({
      id,
      calculatedTotalScore
    });
  },

  // Picker 选择事件
  onPickerChange(e) {
    const { group, key } = e.currentTarget.dataset; // 获取分组和键值
    const selectedIndex = e.detail.value; // 获取选中的索引

    // 更新选中的值
    this.setData({
      [`selectedValues.${group}.${key}`]: parseInt(selectedIndex),
    });

    // 重新计算总分
    this.calculateTotalScore();
  },

  // 计算总分
  calculateTotalScore() {
    const { selectedValues, dropdownOptions } = this.data;

    // 根据公式设置总分
    const voluntarySymmetryScore = this.sumNestedValues(selectedValues["voluntary symmetry"], dropdownOptions["voluntary symmetry"]);
    const restSymmetryScore = this.sumNestedValues(selectedValues["rest symmetry"], dropdownOptions["rest symmetry"]);
    const synkinesisScore = this.sumNestedValues(selectedValues["synkinesis"], dropdownOptions["synkinesis"]);

    const calculatedTotalScore = (4 * voluntarySymmetryScore) - (5 * restSymmetryScore) - synkinesisScore;

    this.setData({
      calculatedTotalScore: calculatedTotalScore.toFixed(2) // 保留两位小数
    });
  },

  // 按照下拉选项计算指定分组的总分
  sumNestedValues(selectedGroup, dropdownGroup) {
    let total = 0;
    for (const key in selectedGroup) {
      const selectedIndex = selectedGroup[key];
      const score = parseFloat(dropdownGroup[key][selectedIndex]);
      total += score;
    }
    return total;
  },

  // 检查选项是否完整
  isInputsComplete() {
    const { selectedValues } = this.data;

    // 遍历所有分组和字段，确保选择值都不为空
    for (const group in selectedValues) {
      for (const key in selectedValues[group]) {
        const value = selectedValues[group][key];
        if (value == null || value === "") {
          return false; // 如果任意字段为空，返回 false
        }
      }
    }

    return true; // 如果所有字段都有值，返回 true
  },

  // 上传评论到后端
  uploadComment() {
    const { id, selectedValues } = this.data;

    // 检查字段是否完整
    if (!this.isInputsComplete()) {
      wx.showToast({
        title: '请填写完整所有字段',
        icon: 'none',
        duration: 2000
      });
      return; // 阻止上传
    }

    // 将 selectedValues 转换为 JSON 字符串
    let realValues = selectedValues;
    for (const key in realValues["voluntary symmetry"]) {
      realValues["voluntary symmetry"][key] += 1
    }

    const commentString = JSON.stringify(realValues);

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
          duration: 2000 // 提示延迟 2 秒
        });

        setTimeout(() => {
          wx.switchTab({
            url: '../logs/logs',
          });
        }, 2000);
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