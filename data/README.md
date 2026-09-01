# 词汇数据说明

`vocabulary.json` 以 KyleBing/english-vocabulary 的六级词库为基础，共 5651 词，并补充了短语、特殊词形和考试词频排序。

## 高频排序口径

- 基础词频采用 exam-data/CETVocabulary 的开源结果。该项目对约 200 套四六级、考研和专四专八试卷做了词形还原统计。
- 生成时只保留本项目六级词库中的单词，并过滤 `question`、`passage`、`answer` 等考试说明词。
- 排名前 1000 的词标记为“高频核心”；无公开词频的词排在其后，以字母顺序保持结果稳定。
- 脚本可以换入更新的纯 CET-6 词频文件重新生成，不改变已有单词 ID 和学习进度。

## 词汇详情

- 中文释义、音标和最多两个常见搭配来自 english-vocabulary 的 `sentence/正序/六级.jsonl`。
- 特殊复数、过去式和过去分词按 ECDICT `exchange` 字段的格式整理，只显示值得特别记忆的不规则变化。
- 项目只保存整理后的词条数据，不保存或分发真题正文。

## 重新生成

```bash
node scripts/build-vocabulary.mjs /path/to/六级.jsonl /path/to/cet_full_list.json
```

数据来源：

- https://github.com/KyleBing/english-vocabulary
- https://github.com/exam-data/CETVocabulary （数据采用 CC BY-NC-SA 4.0）
- https://github.com/skywind3000/ECDICT （MIT）
