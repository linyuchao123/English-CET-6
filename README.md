# 六级词伴（English CET-6）

一个面向 2026 年 12 月英语六级考试的高频词学习平台。项目以“先掌握高频词，再通过检测找出薄弱词”为核心，提供每日学习、词汇总览、四选一检测、学习统计、英语发音和系统提醒。

![六级词伴预览](./public/og.png)

## 在线体验

[打开六级词伴](https://cet6-vocabulary.lyc20260327.chatgpt.site/)

> 当前站点为个人学习项目，访问时可能需要登录获得授权。

## 核心功能

- **每日 60 词**：优先安排最多 10 个薄弱复习词，再补充至少 50 个高频新词；完成后可继续追加学习。
- **高频词优先**：从 5651 个六级词汇中整理出高频核心 1000 词，并按考试词频推进。
- **词汇详情**：包含音标、精简中文释义、常见搭配，以及不规则复数、过去式和过去分词。
- **英语发音**：调用浏览器语音能力，支持美音、英音和三档语速，也可以自动连播。
- **掌握检测**：每组从已掌握词汇中生成 40 道英文选中文四选一题；答错后自动归入薄弱词，完成后可继续下一组。
- **词汇总览**：支持英文或中文搜索、学习状态筛选、高频核心筛选，以及词频、字母和最近学习排序。
- **学习统计**：展示本周、本月新学词数、近 7 天学习量、掌握分布、连续学习和检测正确率。
- **考试倒计时**：按北京时间显示距离预计 2026 年 12 月六级笔试的剩余天数。
- **跨设备进度**：学习状态、每日任务和检测记录保存到 Cloudflare D1。
- **每日提醒**：支持 Web Push 订阅，可由定时任务在北京时间 08:00 调用推送接口。

## 学习闭环

```text
高频新词学习 → 标记掌握程度 → 四选一检测 → 错题进入薄弱词 → 次日优先复习
```

每日基础任务由至少 50 个高频新词和最多 10 个薄弱词组成；薄弱词不足时会自动用新词补足 60 词。完成当天词单后，可以每次追加 20 个尚未学习的新词。完成高频核心 1000 词后，继续按词频由高到低学习其余词汇。

## 技术栈

- Next.js 16、React 19、TypeScript
- Vinext、Vite 8
- Cloudflare Workers、D1
- Drizzle ORM
- Web Speech API、Web Push、Service Worker
- OpenAI Sites

## 本地运行

### 1. 环境要求

- Node.js 22.13 或更高版本
- npm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制示例配置并填写需要的值：

```bash
cp .env.example .env.local
```

| 变量 | 用途 |
| --- | --- |
| `VAPID_SUBJECT` | Web Push 联系地址，例如 `mailto:you@example.com` |
| `VAPID_SERVER_PUBLIC_KEY` | VAPID 公钥，提供给浏览器订阅通知 |
| `VAPID_SERVER_PRIVATE_KEY` | VAPID 私钥，仅保存在服务端 |
| `DAILY_PUSH_TOKEN` | 调用每日推送接口时使用的 Bearer Token |
| `SITE_ORIGIN` | 网站完整地址，本地可使用 `http://localhost:3000` |

不要把真实密钥提交到仓库。

### 4. 启动开发服务

```bash
npm run dev
```

打开 `http://localhost:3000` 即可访问。

## 常用命令

```bash
npm run dev          # 启动开发服务
npm run lint         # 执行代码检查
npm test             # 运行自动测试
npm run build        # 生成生产构建
npm run db:generate  # 根据数据库结构生成迁移
```

## 每日推送

用户在首页开启通知后，浏览器会创建 Web Push 订阅。外部定时任务需要在每天北京时间 08:00 请求：

```http
POST /api/push/daily
Authorization: Bearer <DAILY_PUSH_TOKEN>
```

接口按北京时间去重，同一天重复调用不会重复发送。iPhone 需要先把网站添加到主屏幕，才能使用 Web Push。

## 项目结构

```text
app/                 页面、客户端交互与 API 路由
data/                整理后的六级词汇数据与数据说明
db/                  D1 数据库访问、每日任务算法和表结构
drizzle/             数据库迁移文件
lib/                 学习配置与推送能力
public/              图标、分享图和 Service Worker
scripts/             词汇数据生成脚本
tests/               高频词、词汇详情和选择题数据测试
```

## 词汇数据

词库共 5651 词，高频核心为排名前 1000 的词。仓库只保存整理后的词条和词频结果，不包含或分发完整考试真题。

- 中文释义、音标和常见搭配：[KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)
- 考试词频基础数据：[exam-data/CETVocabulary](https://github.com/exam-data/CETVocabulary)
- 特殊词形字段格式：[skywind3000/ECDICT](https://github.com/skywind3000/ECDICT)

更详细的统计口径、许可证说明和重新生成方法见 [data/README.md](./data/README.md)。

## 数据与隐私

- 学习进度、检测记录和推送订阅保存在站点绑定的 D1 数据库中。
- 推送私钥和调用令牌只应配置在服务端环境变量中。
- 本项目用于个人英语学习，不提供考试结果保证。

## 当前目标

在 2026 年 12 月 CET-6 前完成高频核心词学习，通过每日复习和掌握检测不断减少薄弱词，形成稳定、可持续的备考节奏。
