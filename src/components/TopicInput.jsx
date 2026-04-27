import { useState } from 'react';
import { ALL_TOPICS } from '../constants/topics.js';
import { AVAILABLE_MODELS } from '../config/debateConfig.js';

// Show 4 random examples on mount
const EXAMPLES = ALL_TOPICS.sort(() => 0.5 - Math.random()).slice(0, 4);

export default function TopicInput({ onSubmit, isRunning, models, setModels }) {
  const [topic, setTopic]   = useState('');
  const [rounds, setRounds] = useState(2);
  
  const { posModelId, negModelId, judModelId } = models;
  const { setPosModelId, setNegModelId, setJudModelId } = setModels;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || isRunning) return;
    onSubmit({ topic: trimmed, rounds });
  }

  return (
    <section className="topic-input-section">
      <div className="topic-card">
        <h2>⚖️ Describe Your Legal Situation</h2>

        <form onSubmit={handleSubmit}>
          <div className="topic-input-wrap">
            <textarea
              id="legal-query-input"
              className="topic-textarea"
              rows={3}
              placeholder="e.g. Do I have a case for wrongful termination after being fired without any notice?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isRunning}
            />
            <button
              id="start-debate-btn"
              type="submit"
              className="topic-submit-btn"
              disabled={isRunning || !topic.trim()}
            >
              {isRunning ? (
                <>
                  <span className="btn-spinner" />
                  Debating…
                </>
              ) : (
                <>⚡ Analyse Case</>
              )}
            </button>
          </div>

          {/* Rounds selector */}
          <div className="rounds-row">
            <span className="rounds-label">Debate rounds:</span>
            {[1, 2, 3, 4].map((r) => (
              <button
                key={r}
                type="button"
                id={`rounds-btn-${r}`}
                className={`rounds-btn${rounds === r ? ' active' : ''}`}
                onClick={() => setRounds(r)}
                disabled={isRunning}
              >
                {r}
              </button>
            ))}
            <span className="rounds-label" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              (more rounds = deeper analysis, longer wait)
            </span>
          </div>

          <div className="model-config-grid">
            <div className="model-config-field">
              <label className="model-config-label" style={{ color: 'var(--pro)' }}>Advocate (For)</label>
              <select 
                className="model-select" 
                value={posModelId} 
                onChange={(e) => setPosModelId(e.target.value)}
                disabled={isRunning}
              >
                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="model-config-field">
              <label className="model-config-label" style={{ color: 'var(--con)' }}>Opponent (Against)</label>
              <select 
                className="model-select" 
                value={negModelId} 
                onChange={(e) => setNegModelId(e.target.value)}
                disabled={isRunning}
              >
                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="model-config-field">
              <label className="model-config-label" style={{ color: 'var(--judge)' }}>Neutral Judge</label>
              <select 
                className="model-select" 
                value={judModelId} 
                onChange={(e) => setJudModelId(e.target.value)}
                disabled={isRunning}
              >
                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </form>

        {/* Example chips */}
        <div className="topic-examples">
          <span className="topic-examples-label">Try:</span>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              id={`example-chip-${i}`}
              className="example-chip"
              onClick={() => setTopic(ex)}
              disabled={isRunning}
            >
              {ex.length > 55 ? ex.slice(0, 55) + '…' : ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
