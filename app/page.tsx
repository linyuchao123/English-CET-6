const previewWords = [
  { word: 'allocate', phonetic: '/ˈæləkeɪt/', translation: 'v. 分配；拨出' },
  { word: 'compelling', phonetic: '/kəmˈpelɪŋ/', translation: 'adj. 引人注目的；令人信服的' },
  { word: 'deteriorate', phonetic: '/dɪˈtɪəriəreɪt/', translation: 'v. 恶化；退化' },
];

export default function Home() {
  return (
    <main className="study-shell">
      <header className="topbar">
        <a className="brand" href="#today" aria-label="六级词伴首页">
          <span className="brand-mark">C6</span><span>六级词伴</span>
        </a>
        <div className="date-chip">8月31日 · 今日 30 词</div>
      </header>
      <section className="hero" id="today">
        <div>
          <p className="eyebrow">DAY 01 · CET-6</p>
          <h1>今天，稳稳记住 30 个词。</h1>
          <p className="hero-copy">每天早上 8 点提醒，不赶进度。先听，再读，最后标记掌握程度。</p>
        </div>
        <div className="progress-card" aria-label="今日学习进度">
          <div className="progress-number">0<span>/30</span></div>
          <div className="progress-track"><span /></div>
          <p>完成今日学习后，进度会自动保存</p>
        </div>
      </section>
      <section className="toolbar" aria-label="学习工具">
        <button className="primary-button" type="button">▶ 自动连播</button>
        <button className="secondary-button" type="button">开启每日提醒</button>
        <span className="quiet-note">北京时间 08:00</span>
      </section>
      <section className="word-list" aria-label="今日单词列表">
        <div className="list-heading">
          <div><span>今日词汇</span><small>24 个新词 · 6 个复习词</small></div>
          <span className="list-count">30 WORDS</span>
        </div>
        {previewWords.map((item, index) => (
          <article className="word-row" key={item.word}>
            <span className="word-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="word-main">
              <div className="word-title"><h2>{item.word}</h2><span>{item.phonetic}</span></div>
              <p>{item.translation}</p>
            </div>
            <button className="sound-button" aria-label={`播放 ${item.word} 的发音`} type="button">🔊</button>
            <div className="word-actions"><button type="button">不熟</button><button type="button">掌握</button></div>
          </article>
        ))}
        <div className="preview-tail">其余 27 个单词将在完整版本中加载</div>
      </section>
    </main>
  );
}
