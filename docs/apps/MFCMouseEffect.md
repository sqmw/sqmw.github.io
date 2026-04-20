# MFCMouseEffect 使用文档

MFCMouseEffect 用来把鼠标点击、拖尾、滚轮、悬停、长按、键盘组合键等输入行为可视化。它适合录屏、教学、直播演示，也适合把鼠标手势和快捷键自动化放进日常工作流。

## 快速开始

1. 打开 [GitHub Releases](https://github.com/sqmw/MFCMouseEffect/releases)。
2. 按平台下载对应安装包或便携包。
3. 首次启动后打开设置页，先启用最需要的效果通道，例如点击、拖尾或键鼠指示。
4. 如果是 macOS，请在系统设置中授权 Accessibility 和 Input Monitoring。
5. 回到桌面移动、点击、滚轮，确认效果能正常跟随输入。

## 推荐配置

- 录屏或教程：启用点击波纹、键鼠指示器、滚轮反馈，关闭过强的拖尾效果。
- 日常使用：只保留轻量点击反馈或悬停提示，避免视觉干扰。
- 演示复杂快捷键：启用键鼠指示器，让组合键和重复按键更容易被观众看到。
- 自动化实验：先用低风险快捷键验证手势映射，再绑定到真实工作流。

## 平台注意事项

- Windows 是当前能力较完整的平台，适合稳定使用和录屏演示。
- macOS 需要系统权限才能捕获全局输入；如果效果消失，优先检查权限。
- Linux 能力会随主线跟进，遇到平台差异时建议先查看 GitHub Issue 或 Release 说明。

## 常见问题

### macOS 启动后没有效果

优先检查系统设置里的 Accessibility 和 Input Monitoring。授权后重新启动应用，再测试点击和滚轮效果。

### 效果太明显，影响日常使用

降低特效强度、缩短持续时间，或只保留点击反馈。录屏时可以再临时打开更强的效果。

### 想看每个版本的下载情况

从项目主页点击 Release 统计，或打开当前文档顶部的 Release 统计入口。

## 反馈入口

- GitHub：<https://github.com/sqmw/MFCMouseEffect>
- Releases：<https://github.com/sqmw/MFCMouseEffect/releases>
- Issues：<https://github.com/sqmw/MFCMouseEffect/issues>
