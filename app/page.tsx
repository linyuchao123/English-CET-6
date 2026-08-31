'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import vocabulary from '@/data/vocabulary.json';

type StudyStatus = 'mastered' | 'unfamiliar';
type Word = (typeof vocabulary)[number];
type DailyWord = Word & { isReview?: boolean; status?: StudyStatus | null };

const DAY_SIZE = 30;
const START_DATE = Date.UTC(2026, 7, 31);

function getBeijingDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function getDailyWords(dateKey: string): Word[] {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dayIndex = Math.max(0, Math.floor((Date.UTC(year, month - 1, day) - START_DATE) / 86_400_000));
  const start = (dayIndex * DAY_SIZE) % vocabulary.length;
  return Array.from({ length: DAY_SIZE }, (_, index) => vocabulary[(start + index) % vocabulary.length]);
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export default function Home() {
  const dateKey = getBeijingDate();
  const fallbackWords = useMemo(() => getDailyWords(dateKey), [dateKey]);
  const [words, setWords] = useState<DailyWord[]>(fallbackWords);
  const [statuses, setStatuses] = useState<Record<number, StudyStatus>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncMessage, setSyncMessage] = useState('进度跨设备同步');
  const [notificationMessage, setNotificationMessage] = useState('开启每日提醒');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const playIndex = useRef(0);
  const completed = Object.keys(statuses).length;

  const dateLabel = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', weekday: 'short',
  }).format(new Date());

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    let active = true;
    fetch('/api/today')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load progress');
        return response.json() as Promise<{ words: DailyWord[] }>;
      })
      .then((data) => {
        if (!active) return;
        setWords(data.words);
        setStatuses(Object.fromEntries(data.words.filter((word) => word.status).map((word) => [word.id, word.status!])))
      })
      .catch(() => active && setSyncMessage('当前使用本机词单，联网后自动同步'));
    return () => { active = false; };
  }, []);

  function speak(word: string, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === 'en-US') ?? voices.find((voice) => voice.lang.startsWith('en')) ?? null;
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }

  function playAll() {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    playIndex.current = 0;
    const playNext = () => {
      if (playIndex.current >= words.length) {
        setIsPlaying(false);
        return;
      }
      const current = words[playIndex.current++];
      speak(current.word, playNext);
    };
    playNext();
  }

  async function markWord(id: number, status: StudyStatus) {
    setStatuses((current) => ({ ...current, [id]: status }));
    try {
      const response = await fetch('/api/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordId: id, status }),
      });
      if (!response.ok) throw new Error('Failed to save progress');
      setSyncMessage('已同步');
    } catch {
      setSyncMessage('保存失败，请稍后再试');
    }
  }

  async function enableNotifications() {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (isIos && !isStandalone) {
      setNotificationMessage('iPhone 请先“添加到主屏幕”');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotificationMessage('当前浏览器不支持系统通知');
      return;
    }
    setIsEnablingNotifications(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationMessage('通知权限未开启');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      const { publicKey } = await fetch('/api/push/key').then((response) => response.json()) as { publicKey: string };
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const saved = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()),
      });
      if (!saved.ok) throw new Error('Failed to save subscription');
      const tested = await fetch('/api/push/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      if (!tested.ok) throw new Error('Failed to send test notification');
      setNotificationMessage('每日提醒已开启');
    } catch {
      setNotificationMessage('开启失败，请稍后重试');
    } finally {
      setIsEnablingNotifications(false);
    }
  }

  return (
    <main className="study-shell">
      <section className="hero" id="today">
        <div>
          <p className="eyebrow">{dateLabel} · TODAY</p>
          <h1>今天，稳稳记住 30 个词。</h1>
          <p className="hero-copy">每天早上 8 点提醒，不赶进度。先听，再读，最后标记掌握程度。</p>
        </div>
        <div className="progress-card" aria-label="今日学习进度">
          <div className="progress-number">{completed}<span>/30</span></div>
          <div className="progress-track"><span style={{ width: `${completed / DAY_SIZE * 100}%` }} /></div>
          <p>{completed === DAY_SIZE ? '今日任务完成，明天继续。' : '标记掌握程度后，进度会自动保存'}</p>
        </div>
      </section>
      <section className="toolbar" aria-label="学习工具">
        <button className="primary-button" onClick={playAll} type="button">{isPlaying ? '■ 停止连播' : '▶ 自动连播'}</button>
        <button className="secondary-button" onClick={enableNotifications} disabled={isEnablingNotifications} type="button">
          {isEnablingNotifications ? '正在开启…' : notificationMessage}
        </button>
        <span className="quiet-note">{syncMessage} · 北京时间 08:00</span>
      </section>
      <section className="word-list" aria-label="今日单词列表">
        <div className="list-heading"><div><span>今日词汇</span><small>{words.filter((word) => word.isReview).length} 个复习词 · {words.filter((word) => !word.isReview).length} 个新词</small></div><span className="list-count">30 WORDS</span></div>
        {words.map((item, index) => (
          <article className="word-row" key={item.id}>
            <span className="word-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="word-main">
              <div className="word-title"><h2>{item.word}</h2><span>{item.phonetic ? `/${item.phonetic.replace(/^\/+|\/+$/g, '')}/` : '暂无音标'}</span></div>
              <p>{item.translation}</p>
            </div>
            <button className="sound-button" onClick={() => speak(item.word)} aria-label={`播放 ${item.word} 的发音`} type="button">🔊</button>
            <div className="word-actions">
              <button className={statuses[item.id] === 'unfamiliar' ? 'active unfamiliar' : ''} onClick={() => markWord(item.id, 'unfamiliar')} type="button">不熟</button>
              <button className={statuses[item.id] === 'mastered' ? 'active mastered' : ''} onClick={() => markWord(item.id, 'mastered')} type="button">掌握</button>
            </div>
          </article>
        ))}
      </section>
      <footer className="site-footer">词汇数据来自 english-vocabulary 开源项目 · 仅用于个人学习</footer>
    </main>
  );
}
