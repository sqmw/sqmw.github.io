# 静态 App 使用文档系统

## 目标

- 在 GitHub Pages 里托管每个 App 的使用文档，不依赖服务器。
- 首页项目卡片匹配到文档后，显示 `使用文档` 入口。
- 文档内容按 App 独立维护，避免把长文塞进首页。
- 项目卡片里将不可点击的信息和可点击操作分开展示，降低用户判断成本。

## 文件结构

- `app-docs.json`：文档注册表，负责项目名、别名、文档路径、GitHub 链接和统计链接。
- `docs.html`：独立文档展示页。
- `app-docs-page.js`：读取注册表、加载 Markdown、渲染文档。
- `docs/apps/*.md`：每个 App 的用户使用文档。

## Markdown 支持范围

当前文档页是轻量渲染器，不是完整 Markdown 引擎。已支持的常用语法：

- 标题：`#` 到 `####`
- 列表：`-`、`*`、`1.`
- 引用：`> `
- 代码块：``` fenced code blocks
- 行内：`` `code` ``、`**bold**`
- 链接：
  - 标准链接：`[text](url)`
  - 自动链接：`<https://example.com>`

## 匹配规则

- 首页加载 GitHub 仓库列表后，再加载 `app-docs.json`。
- 匹配字段包括 `repo`、`slug`、`aliases`。
- 匹配时会忽略大小写，并把 `-`、`_`、空格视为等价。
- 例如 `desk_tidy_sticky`、`desk-tidy-sticky`、`desk tidy sticky` 会匹配到同一个文档。

## 首页入口设计

- 项目卡片采用上下结构，而不是右侧信息栏，避免不同描述长度造成错位。
- 顶部放项目标题和操作按钮：项目标题是 GitHub 仓库外链，并带外链图标。
- 中部只放项目描述，描述有最大行数和行高控制，避免长文本挤压元数据。
- 底部放事实信息：语言、Star 数、更新时间，不作为点击入口。
- `文档`、`统计`、`趋势` 使用统一按钮样式，明确表示可点击操作。

## 新增 App 文档步骤

1. 在 `docs/apps/` 下新增 Markdown 文档。
2. 在 `app-docs.json` 增加一条注册记录。
3. 确认首页对应项目卡片出现 `使用文档` 入口。
4. 打开 `docs.html?repo=<repo>` 验证文档加载。

## 当前已接入

- `MFCMouseEffect`
- `desk_tidy_sticky`
