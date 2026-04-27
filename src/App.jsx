import { useState, useCallback } from 'react';
import './App.css';
import TopicInput  from './components/TopicInput.jsx';
import DebateArena from './components/DebateArena.jsx';
import { runDebate, MODELS } from './utils/debateEngine.js';

import { DEBATE_CONFIG, AVAILABLE_MODELS } from './config/debateConfig.js';

const [DEFAULT_POS, DEFAULT_NEG, DEFAULT_JUD] = [
  DEBATE_CONFIG.models.positive,
  DEBATE_CONFIG.models.negative,
  DEBATE_CONFIG.models.judge
];

export default function App() {
  const [history,        setHistory]        = useState([]);
  const [synthesis,      setSynthesis]      = useState(null);
  const [strengthScores, setStrengthScores] = useState([]);
  const [collapsePoint,  setCollapsePoint]  = useState(null);
  const [isRunning,      setIsRunning]      = useState(false);
  const [error,          setError]          = useState(null);
  const [currentStatus,  setCurrentStatus]  = useState('');
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps,     setTotalSteps]     = useState(0);
  const [currentTopic,   setCurrentTopic]   = useState('');

  // Model selection state (stored as IDs)
  const [posModelId, setPosModelId] = useState(DEFAULT_POS);
  const [negModelId, setNegModelId] = useState(DEFAULT_NEG);
  const [judModelId, setJudModelId] = useState(DEFAULT_JUD);

  // Helper to get provider for a model ID
  const getProvider = (id) => AVAILABLE_MODELS.find(m => m.id === id)?.provider || 'groq';
  const getName = (id) => AVAILABLE_MODELS.find(m => m.id === id)?.name || id;

  const handleSubmit = useCallback(async ({ topic, rounds }) => {
    // Reset state
    setHistory([]);
    setSynthesis(null);
    setStrengthScores([]);
    setCollapsePoint(null);
    setError(null);
    setCompletedSteps(0);
    setCurrentTopic(topic);

    // totalSteps = 2 turns per round + 1 for synthesis
    const total = rounds * 2 + 1;
    setTotalSteps(total);
    setIsRunning(true);
    setCurrentStatus('Preparing legal debate…');

    let stepsDone = 0;

    try {
      const result = await runDebate({
        topic,
        positiveModel: getProvider(posModelId),
        negativeModel: getProvider(negModelId),
        judgeModel:    getProvider(judModelId),
        positiveModelId: posModelId,
        negativeModelId: negModelId,
        judgeModelId:    judModelId,
        rounds,
        onTurnComplete: (turnData) => {
          stepsDone += 1;
          setCompletedSteps(stepsDone);

          const side = turnData.turn === 'positive' ? 'For' : 'Against';
          setCurrentStatus(
            `Round ${turnData.round} — ${side} the claim (${turnData.model})…`
          );

          // Append turn live so user sees it as it comes in
          setHistory((prev) => {
            // Avoid duplicates (the engine passes the full turn object)
            const already = prev.some(
              (t) => t.round === turnData.round && t.role === turnData.role
            );
            if (already) return prev;
            const { turn: _t, ...cleanTurn } = turnData;
            return [...prev, cleanTurn];
          });
        },
      });

      setCurrentStatus(`${getName(judModelId)} is writing final verdict…`);
      setCompletedSteps(total - 1);

      // Use the final, authoritative history from the engine
      setHistory(result.history);
      setSynthesis(result.synthesis);
      setStrengthScores(result.strengthScores);
      setCollapsePoint(result.collapsePoint);
      setCompletedSteps(total);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsRunning(false);
      setCurrentStatus('');
    }
  }, [posModelId, negModelId, judModelId]);

  const hasResults = history.length > 0 || synthesis;

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="icon-gavel">⚖️</span>
          LegalDebate AI
          <span className="navbar-tag">Prototype</span>
        </div>
        <div className="navbar-models">
          <span style={{ color: 'var(--pro)' }}>{getName(posModelId)}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>vs</span>
          <span style={{ color: 'var(--con)' }}>{getName(negModelId)}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>judged by</span>
          <span style={{ color: 'var(--judge)' }}>{getName(judModelId)}</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="hero-section">
        <h1>Multi-LLM <span>Legal</span> Decision Support</h1>
        <p>
          Describe your legal situation. Two AI models argue for and against your claim.
          A neutral AI judge evaluates both sides and gives you a balanced verdict.
        </p>
        <div className="hero-models">
          <div className="hero-model-chip pro">
            <span className="dot" />
            {getName(posModelId)}
          </div>
          <span className="hero-vs">⚡ vs ⚡</span>
          <div className="hero-model-chip con">
            <span className="dot" />
            {getName(negModelId)}
          </div>
          <span className="hero-vs">→</span>
          <div className="hero-model-chip judge">
            <span className="dot" />
            {getName(judModelId)}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Topic Input */}
        <TopicInput 
          onSubmit={handleSubmit} 
          isRunning={isRunning}
          models={{ posModelId, negModelId, judModelId }}
          setModels={{ setPosModelId, setNegModelId, setJudModelId }}
        /> 
        {/* Active topic display */}
        {currentTopic && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 18px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}>
            <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>⚖️ Debating:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{currentTopic}</strong>
          </div>
        )}

        {/* Debate output */}
        {hasResults && (
          <DebateArena
            history={history}
            synthesis={synthesis}
            strengthScores={strengthScores}
            collapsePoint={collapsePoint}
            isRunning={isRunning}
            currentStatus={currentStatus}
            totalSteps={totalSteps}
            completedSteps={completedSteps}
            error={error}
          />
        )}

        {/* Error when no results yet */}
        {error && !hasResults && (
          <div id="error-banner-main" className="error-banner">
            <span>⚠️</span>
            <span><strong>Error:</strong> {error}</span>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        LegalDebate AI · Prototype · Not legal advice · Consult a licensed advocate for your situation
      </footer>
    </div>
  );
}
