'use client';

import { useEffect, useState } from 'react';
import { usePronunciation } from '../use-pronunciation';

type Filter = 'all' | 'mastered' | 'unfamiliar' | 'unlearned';
type WordItem = { id: number; word: string; phonetic: string; translation: string; status: Exclude<Filter, 'all'> };
type VocabularyData = {
  words: WordItem[];
  counts: Record<Filter, number>;
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
  const [page, setPage] = useState(1);
  const [data, setData] = useState<VocabularyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { speak } = usePronunciation();

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ query, status: filter, page: String(page) });
      fetch(`/api/vocabulary?${params}`, { signal: controller.signal })
        .then((response) => response.json() as Promise<VocabularyData>)
        .then(setData)
        .finally(() => setLoading(false));
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, filter, page]);

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

      <section className="catalog-card">
        <div className="catalog-tools">
          <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索英文或中文释义" /></label>
          <span className="catalog-total">找到 {data?.total ?? 0} 个词</span>
        </div>
        <div className={`catalog-list ${loading ? 'loading' : ''}`}>
          {data?.words.map((item) => (
            <article className="catalog-row" key={item.id}>
              <div className="catalog-word"><strong>{item.word}</strong><span>{item.phonetic ? `/${item.phonetic.replace(/^\/+|\/+$/g, '')}/` : '暂无音标'}</span></div>
              <p>{item.translation}</p>
              <button className="catalog-sound" onClick={() => speak(item.word)} type="button" aria-label={`播放 ${item.word} 的发音`}>听音</button>
              <span className={`status-pill ${item.status}`}>{item.status === 'mastered' ? '已掌握' : item.status === 'unfamiliar' ? '薄弱词' : '未学习'}</span>
            </article>
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
