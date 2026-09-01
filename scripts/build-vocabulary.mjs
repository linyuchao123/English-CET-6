import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const detailsPath = process.argv[2] ?? '/private/tmp/cet6.jsonl';
const frequencyPath = process.argv[3] ?? '/private/tmp/cet_full_list.json';
const current = JSON.parse(readFileSync(resolve(root, 'data/vocabulary.json'), 'utf8'));
const frequencyRows = JSON.parse(readFileSync(frequencyPath, 'utf8'))['四六级词汇词频排序表'];

const details = new Map();
for await (const line of createInterface({ input: createReadStream(detailsPath), crlfDelay: Infinity })) {
  if (!line.trim()) continue;
  const item = JSON.parse(line);
  details.set(item.word.toLowerCase(), item);
}

const excluded = new Set([
  'answer', 'begin', 'choice', 'choose', 'comprehension', 'direction', 'essay', 'following',
  'letter', 'listen', 'mark', 'paragraph', 'passage', 'question', 'read', 'section', 'statement',
  'word', 'write', 'english', 'can', 'should', 'what', 'whether', 'which', 'through',
]);

const frequencyByWord = new Map(frequencyRows.map((row) => [row['单词'].toLowerCase(), Number(row['词频']) || 0]));
const ordered = [...current].sort((a, b) => {
  const aFrequency = excluded.has(a.word.toLowerCase()) ? 0 : (frequencyByWord.get(a.word.toLowerCase()) ?? 0);
  const bFrequency = excluded.has(b.word.toLowerCase()) ? 0 : (frequencyByWord.get(b.word.toLowerCase()) ?? 0);
  return bFrequency - aFrequency || a.word.localeCompare(b.word);
});
const rankById = new Map(ordered.map((item, index) => [item.id, index + 1]));

const irregularForms = {
  arise: { past: 'arose', pastParticiple: 'arisen' }, awake: { past: 'awoke', pastParticiple: 'awoken' },
  bear: { past: 'bore', pastParticiple: 'borne / born' }, bind: { past: 'bound', pastParticiple: 'bound' },
  breed: { past: 'bred', pastParticiple: 'bred' }, cast: { past: 'cast', pastParticiple: 'cast' },
  cling: { past: 'clung', pastParticiple: 'clung' }, creep: { past: 'crept', pastParticiple: 'crept' },
  deal: { past: 'dealt', pastParticiple: 'dealt' }, flee: { past: 'fled', pastParticiple: 'fled' },
  forbid: { past: 'forbade', pastParticiple: 'forbidden' }, foresee: { past: 'foresaw', pastParticiple: 'foreseen' },
  forgive: { past: 'forgave', pastParticiple: 'forgiven' }, freeze: { past: 'froze', pastParticiple: 'frozen' },
  grind: { past: 'ground', pastParticiple: 'ground' }, undergo: { past: 'underwent', pastParticiple: 'undergone' },
  undertake: { past: 'undertook', pastParticiple: 'undertaken' }, withdraw: { past: 'withdrew', pastParticiple: 'withdrawn' },
  withstand: { past: 'withstood', pastParticiple: 'withstood' },
  criterion: { plural: 'criteria' }, phenomenon: { plural: 'phenomena' }, medium: { plural: 'media / mediums' },
  stimulus: { plural: 'stimuli' }, basis: { plural: 'bases' }, analysis: { plural: 'analyses' },
  crisis: { plural: 'crises' }, thesis: { plural: 'theses' }, hypothesis: { plural: 'hypotheses' },
  index: { plural: 'indexes / indices' },
};

function cleanMeanings(item, fallback) {
  const meanings = (item?.translations ?? []).slice(0, 3).map(({ type, translation }) => ({
    partOfSpeech: type || '', meaning: String(translation).replace(/\s+/g, ' ').trim(),
  })).filter((entry) => entry.meaning);
  if (meanings.length) return meanings;
  const match = fallback.match(/^([a-z]+\.)\s*(.*)$/i);
  return [{ partOfSpeech: match?.[1]?.replace('.', '') ?? '', meaning: match?.[2] ?? fallback }];
}

const output = current.map((word) => {
  const key = word.word.toLowerCase();
  const item = details.get(key);
  const meanings = cleanMeanings(item, word.translation);
  const phrases = (item?.phrases ?? []).slice(0, 2).map(({ phrase, translation }) => ({ phrase, meaning: translation }));
  const frequencyRank = rankById.get(word.id);
  const frequency = excluded.has(key) ? 0 : (frequencyByWord.get(key) ?? 0);
  return {
    ...word,
    phonetic: item?.us || item?.uk || word.phonetic,
    translation: meanings.map((entry) => `${entry.partOfSpeech ? `${entry.partOfSpeech}. ` : ''}${entry.meaning}`).join('；'),
    meanings,
    phrases,
    forms: irregularForms[key] ?? {},
    frequencyRank,
    frequency,
    isHighFrequency: frequencyRank <= 1000,
  };
});

writeFileSync(resolve(root, 'data/vocabulary.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`已生成 ${output.length} 个词，其中高频核心词 ${output.filter((word) => word.isHighFrequency).length} 个。`);
