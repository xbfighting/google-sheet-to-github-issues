# Google Sheets to GitHub Issues Sync

自动同步 Google Sheets 数据到 GitHub Issues 的工具。

## 功能特性

- 📊 从 Google Sheets 读取数据并创建/更新 GitHub Issues
- 🔄 支持单次同步和持续监听模式
- 🏷️ 自动映射标签、分配人等字段
- 📝 智能检测重复，避免创建重复 Issue
- 🔍 根据标题查找已存在的 Issue

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（基于 `.env.example`）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# GitHub 配置
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repo_name

# Google Sheets 配置
GOOGLE_CREDENTIALS_PATH=./creditial/corded-axiom-469714-a0-7462020e4cab.json
SPREADSHEET_ID=1xsWvM39yYO0917zu1ntjV1citrazGnp6maZil42E4eI
SHEET_NAME=Sheet1

# 同步配置
SYNC_INTERVAL_MINUTES=5
SYNC_MODE=one-way
```

### 3. 设置 Google Sheets 权限

确保你的 Google 服务账号邮箱有权访问目标 Sheet：

1. 打开你的 Google Sheet
2. 点击右上角"共享"按钮
3. 添加服务账号邮箱：`sheet-to-github@corded-axiom-469714-a0.iam.gserviceaccount.com`
4. 设置为"查看者"权限

### 4. 运行程序

```bash
# 测试连接
npm run test

# 查看 Sheet 列名和字段映射
npm run dev headers

# 执行单次同步
npm run sync

# 启动持续监听（每5分钟同步一次）
npm run watch
```

## 字段映射

默认字段映射关系：

| Google Sheet 列名 | GitHub Issue 字段 | 说明 |
|------------------|------------------|------|
| Title | title | Issue 标题 |
| Description | body | Issue 描述内容 |
| Labels | labels | 标签（逗号分隔） |
| Assignees | assignees | 分配人（逗号分隔） |
| Status | state | 状态（open/closed） |

### 自定义字段映射

编辑 `src/config/index.ts` 中的 `defaultFieldMappings` 来自定义映射关系。

## Sheet 格式示例

你的 Google Sheet 应该包含以下列：

| Title | Description | Labels | Assignees | Status |
|-------|------------|--------|-----------|--------|
| Bug: 登录失败 | 用户无法登录系统 | bug,urgent | alice,bob | open |
| 新功能：导出 | 添加数据导出功能 | enhancement | charlie | open |
| 修复样式问题 | 首页样式错位 | bug,ui | | closed |

## 部署选项

### 使用 GitHub Actions（推荐）

创建 `.github/workflows/sync.yml`：

```yaml
name: Sync Google Sheets to GitHub Issues

on:
  schedule:
    - cron: '*/15 * * * *'  # 每15分钟运行一次
  workflow_dispatch:  # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - run: npm ci
      
      - name: Sync Issues
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
          SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
          GITHUB_OWNER: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
        run: |
          echo "$GOOGLE_CREDENTIALS" > credentials.json
          export GOOGLE_CREDENTIALS_PATH=./credentials.json
          npm run sync
```

### 使用 PM2（服务器部署）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "sheet-sync" -- run watch

# 查看日志
pm2 logs sheet-sync

# 停止服务
pm2 stop sheet-sync
```

## 常见问题

### 1. Google Sheets API 权限错误

确保：
- 服务账号已创建并启用了 Sheets API
- 服务账号邮箱已添加到 Sheet 的共享用户中
- 凭证文件路径正确

### 2. GitHub API 限流

- 使用 Personal Access Token 可获得更高的 API 限额
- 调整 `SYNC_INTERVAL_MINUTES` 避免频繁请求

### 3. 重复创建 Issue

程序会：
1. 首先检查内存中的映射关系
2. 其次通过标题搜索已存在的 Issue
3. 只有找不到时才创建新 Issue

## 日志

同步日志保存在 `sync.log` 文件中，同时输出到控制台。

## License

MIT