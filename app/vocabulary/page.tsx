'use client';

import { useEffect, useState } from 'react';
import { usePronunciation } from '../use-pronunciation';

type Filter = 'all' | 'mastered' | 'unfamiliar' | 'unlearned';
type WordItem = { id: number; word: string; phonetic: string; translation: string; status: Exclude<Filter, 'all'>; frequencyRank: number; frequency: number; isHighFrequency: boolean; verified: boolean; phrases: { phrase: string; meaning: string }[]; forms: { plural?: string; past?: string; pastParticiple?: string } };
type VocabularyData = {
  words: WordItem[];
  counts: Record<Filter, number>;
  coreCounts: Record<Filter | 'verified', number>;
  page: number;
  totalPages: number;
  total: number;
};

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部词汇' },
  { value: 'mastered', label: '已掌握' },
  { value: 'unfamiliar', label: '薄弱词' },
  { value: 'unlearned', label: '未学习' },
];

export default function VocabularyPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [scope, setScope] = useState<'all' | 'core'>('all');
  const [sort, setSort] = useState<'frequency' | 'alphabetical' | 'recent'>('frequency');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<VocabularyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { speak } = usePronunciation();

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ query, status: filter, scope, sort, page: String(page) });
      fetch(`/api/vocabulary?${params}`, { signal: controller.signal })
        .then((response) => response.json() as Promise<VocabularyData>)
        .then(setData)
        .finally(() => setLoading(false));
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, filter, scope, sort, page]);

  function chooseFilter(value: Filter) {
    setFilter(value);
    setPage(1);
  }

  return (
    <main className="content-shell">
      <section className="page-heading">
        <div><p className="eyebrow">VOCABULARY · 5651</p><h1>把所有六级词汇，放在一张清单里。</h1></div>
        <p>随时搜索单词或中文释义，集中复习薄弱词，也能清楚看到自己的整体进度。</p>
      </section>

      <section className="summary-grid" aria-label="词汇学习概览">
        {filters.map((item) => (
          <button className={`summary-card ${filter === item.value ? 'active' : ''}`} onClick={() => chooseFilter(item.value)} key={item.value} type="button">
            <span>{item.label}</span><strong>{data?.counts[item.value] ?? '—'}</strong>
          </button>
        ))}
      </section>

      <section className="core-progress-card">
        <div><p className="eyebrow">HIGH FREQUENCY · TOP 1000</p><h2>先拿下高频核心词</h2><span>按考试词频由高到低推进，完成后再扩展到其余词汇。</span></div>
        <div className="core-numbers"><p><strong>{data?.coreCounts.mastered ?? 0}</strong><span>已掌握</span></p><p><strong>{data?.coreCounts.unfamiliar ?? 0}</strong><span>薄弱词</span></p><p><strong>{data?.coreCounts.verified ?? 0}</strong><span>检测通过</span></p><p><strong>{data?.coreCounts.unlearned ?? 1000}</strong><span>未学习</span></p></div>
      </section>

      <section className="catalog-card">
        <div className="catalog-tools">
          <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索英文或中文释义" /></label>
          <div className="catalog-filters"><select aria-label="词汇范围" value={scope} onChange={(event) => { setScope(event.target.value as 'all' | 'core'); setPage(1); }}><option value="all">全部范围</option><option value="core">高频核心</option></select><select aria-label="排序方式" value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }}><option value="frequency">按考试频率</option><option value="alphabetical">按字母顺序</option><option value="recent">最近学习</option></select><span className="catalog-total">找到 {data?.total ?? 0} 个词</span></div>
        </div>
        <div className={`catalog-list ${loading ? 'loading' : ''}`}>
          {data?.words.map((item) => (
            <details className="catalog-item" key={item.id}>
              <summary className="catalog-row">
                <div className="catalog-word"><strong>{item.word}</strong><span>{item.phonetic ? `/${item.phonetic.replace(/^\/+|\/+$/g, '')}/` : '暂无音标'}</span>{item.isHighFrequency && <em>高频 #{item.frequencyRank}</em>}</div>
                <p>{item.translation}</p>
                <span className={`status-pill ${item.status}`}>{item.verified ? '检测通过' : item.status === 'mastered' ? '已掌握' : item.status === 'unfamiliar' ? '薄弱词' : '未学习'}</span>
                <span className="detail-toggle">详情</span>
              </summary>
              <div className="catalog-detail"><button className="catalog-sound" onClick={() => speak(item.word)} type="button">播放发音</button>{item.phrases.length > 0 && <div><strong>常见搭配</strong>{item.phrases.map((phrase) => <p key={phrase.phrase}><b>{phrase.phrase}</b><span>{phrase.meaning}</span></p>)}</div>}{Object.keys(item.forms).length > 0 && <div><strong>特殊词形</strong><p>{item.forms.plural && `复数 ${item.forms.plural}`}{item.forms.past && `过去式 ${item.forms.past}`}{item.forms.pastParticiple && ` · 过去分词 ${item.forms.pastParticiple}`}</p></div>}{item.phrases.length === 0 && Object.keys(item.forms).length === 0 && <span className="quiet-note">暂无需要额外记忆的搭配或特殊词形</span>}</div>
            </details>
          ))}
          {!loading && data?.words.length === 0 && <div className="empty-state">没有找到符合条件的词，换个关键词试试。</div>}
        </div>
        <div className="pagination">
          <button disabled={!data || data.page <= 1} onClick={() => setPage((current) => current - 1)} type="button">上一页</button>
          <span>第 {data?.page ?? 1} / {data?.totalPages ?? 1} 页</span>
          <button disabled={!data || data.page >= data.totalPages} onClick={() => setPage((current) => current + 1)} type="button">下一页</button>
        </div>
      </section>
    </main>
  );
}
