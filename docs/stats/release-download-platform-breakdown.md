# Release 下载统计平台拆分

## 目标

- `stats.html` 的明细表中，下载量不再只显示 release 总数。
- 同一 release 下的多个 asset 先按平台聚合，再展示平台下载量，最后显示该 release 的总下载量。

## 当前统计口径

- 数据源：GitHub Releases API 返回的 `release.assets[].download_count`。
- release 总下载量：该 release 下所有 asset 的 `download_count` 求和。
- 平台下载量：先根据 asset 文件名识别平台，再把同平台 asset 的下载量聚合。

## 平台识别规则

- `Windows`
  - 文件名包含：`win`、`windows`、`exe`、`msi`、`x64`、`x86`、`amd64`
- `macOS`
  - 文件名包含：`mac`、`macos`、`osx`、`darwin`、`dmg`、`pkg`、`arm64`、`universal`
- `Linux`
  - 文件名包含：`linux`、`appimage`、`deb`、`rpm`、`snap`、`apk`
- `Other`
  - 未命中以上规则的 asset

## 页面表现

- `Assets` 列只保留原始 asset 文件名。
- `Downloads` 列改为：
  - 平台 1 下载量
  - 平台 2 下载量
  - ...
  - `Total`
- 表格视觉上采用“信息分组”样式：
  - `Assets` 使用轻量卡片块，降低长文件名堆叠造成的阅读压力
  - `Downloads` 使用分组统计块，突出平台数字与总数

## 代码位置

- 统计与聚合逻辑：`stats.js`
- 详情表样式：`style.css`

## 回归检查

1. 打开 `stats.html?username=sqmw&repository=MFCMouseEffect`
2. 确认 `Detailed Statistics` 中：
   - `Assets` 列仅展示原始文件名，不再重复显示平台标签
   - `Downloads` 列先显示平台下载量，再显示 `Total`
   - `Total` 等于该 release 下所有平台下载量之和
3. 随机检查一个包含多平台包的 release，确认 Windows 与 macOS 不再混成单条不可分辨的下载数
