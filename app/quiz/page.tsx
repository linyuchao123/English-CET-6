'use client';

import { useEffect, useState } from 'react';
import { usePronunciation } from '../use-pronunciation';
import Link from 'next/link';

type Question = { wordId: number; word: string; phonetic: string; options: string[] };
type Answer = { correct: boolean; correctMeaning: string; word: string };

export default function QuizPage() {
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [available, setAvailable] = useState(0);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [results, setResults] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const { speak } = usePronunciation();

  function loadQuiz() {
    setLoading(true); setIndex(0); setAnswer(null); setResults([]);
    fetch('/api/quiz?count=20').then((response) => response.json()).then((data) => {
      setSessionId(data.sessionId); setQuestions(data.questions); setAvailable(data.available);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch('/api/quiz?count=20').then((response) => response.json()).then((data) => {
      setSessionId(data.sessionId); setQuestions(data.questions); setAvailable(data.available);
    }).finally(() => setLoading(false));
  }, []);
  const current = questions[index];
  const finished = questions.length > 0 && index >= questions.length;

  async function choose(selectedMeaning: string) {
    if (!current || answer) return;
    const response = await fetch('/api/quiz/answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, wordId: current.wordId, selectedMeaning }),
    });
    const data = await response.json() as Answer;
    setAnswer(data); setResults((items) => [...items, data]);
  }

  function next() { setAnswer(null); setIndex((value) => value + 1); }
  const correctCount = results.filter((item) => item.correct).length;

  return <main className="content-shell quiz-shell">
    <section className="page-heading quiz-heading"><div><p className="eyebrow">MASTERY CHECK</p><h1>真正认识，才算掌握。</h1></div><p>从你标记为“已掌握”的词里抽取 20 题。选错的词会自动回到薄弱词，进入之后的每日复习。</p></section>
    {loading ? <section className="quiz-card empty-state">正在准备题目…</section> : questions.length === 0 ?
      <section className="quiz-card quiz-empty"><strong>还没有可检测的词</strong><p>先到今日学习标记一些“掌握”词汇，再回来检验自己是否真的认识。</p><Link href="/">去学习今日词汇</Link></section> : finished ?
      <section className="quiz-card quiz-result"><p className="eyebrow">本组完成</p><strong>{correctCount}<span> / {questions.length}</span></strong><h2>正确率 {Math.round(correctCount / questions.length * 100)}%</h2><p>{results.some((item) => !item.correct) ? `有 ${results.length - correctCount} 个词已归入薄弱词，之后会再次遇到。` : '全部答对，这组词掌握得很扎实。'}</p><button className="primary-button" onClick={loadQuiz} type="button">再测一组</button></section> :
      <section className="quiz-card">
        <div className="quiz-progress"><span>第 {index + 1} / {questions.length} 题</span><span>已掌握词库 {available} 词</span></div>
        <div className="quiz-word"><button onClick={() => speak(current.word)} type="button">听音</button><h2>{current.word}</h2><span>{current.phonetic ? `/${current.phonetic.replace(/^\/+|\/+$/g, '')}/` : ''}</span></div>
        <p className="quiz-prompt">请选择最准确的中文意思</p>
        <div className="quiz-options">{current.options.map((option, optionIndex) => <button className={answer ? option === answer.correctMeaning ? 'correct' : 'disabled' : ''} disabled={Boolean(answer)} onClick={() => choose(option)} key={option} type="button"><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>
        {answer && <div className={`quiz-feedback ${answer.correct ? 'right' : 'wrong'}`}><strong>{answer.correct ? '回答正确，继续保持。' : '回答错误，已归入薄弱词。'}</strong><span>正确答案：{answer.correctMeaning}</span><button onClick={next} type="button">{index + 1 === questions.length ? '查看结果' : '下一题'}</button></div>}
      </section>}
  </main>;
}
