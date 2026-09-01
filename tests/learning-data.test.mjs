import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const vocabulary = JSON.parse(readFileSync(new URL('../data/vocabulary.json', import.meta.url), 'utf8'));

test('高频核心词固定为 1000 个并按唯一排名生成', () => {
  const core = vocabulary.filter((word) => word.isHighFrequency);
  assert.equal(core.length, 1000);
  assert.equal(new Set(vocabulary.map((word) => word.frequencyRank)).size, vocabulary.length);
  assert.ok(core.every((word) => word.frequencyRank <= 1000));
});

test('词汇详情保持精简且结构完整', () => {
  for (const word of vocabulary) {
    assert.ok(word.meanings.length >= 1 && word.meanings.length <= 3);
    assert.ok(word.phrases.length <= 2);
    assert.ok(Object.keys(word.forms).every((key) => ['plural', 'past', 'pastParticiple'].includes(key)));
  }
});

test('每个高频词都能生成四个不重复的同词性中文选项', () => {
  const byPartOfSpeech = new Map();
  for (const word of vocabulary) {
    const pos = word.meanings[0]?.partOfSpeech ?? '';
    const meaning = `${pos ? `${pos}. ` : ''}${word.meanings[0].meaning}`;
    const meanings = byPartOfSpeech.get(pos) ?? new Set();
    meanings.add(meaning);
    byPartOfSpeech.set(pos, meanings);
  }
  for (const word of vocabulary.filter((item) => item.isHighFrequency)) {
    assert.ok((byPartOfSpeech.get(word.meanings[0]?.partOfSpeech ?? '')?.size ?? 0) >= 4);
  }
});
