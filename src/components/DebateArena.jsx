import TurnCard from './TurnCard.jsx';
import SynthesisPanel from './SynthesisPanel.jsx';

/**
 * DebateArena
 * Renders the live debate turns grouped by round, the progress indicator,
 * and the final synthesis panel once the debate completes.
 */
export default function DebateArena({
  history,
  synthesis,
  strengthScores,
  collapsePoint,
  isRunning,
  currentStatus,
  totalSteps,
  completedSteps,
  error,
}) {
  // Group turns by round number
  const rounds = history.reduce((acc, turn) => {
    const r = turn.round;
    if (!acc[r]) acc[r] = [];
    acc[r].push(turn);
    return acc;
  }, {});

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div className="debate-arena">

      {/* ── Error banner ── */}
      {error && (
        <div id="error-banner" className="error-banner">
          <span>⚠️</span>
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* ── Progress indicator (while running) ── */}
      {isRunning && (
        <div id="progress-banner" className="progress-banner">
          <span className="progress-spinner" />
          <span className="progress-text">
            <strong>{currentStatus || 'Starting debate…'}</strong>
          </span>
          <div className="progress-steps">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`progress-step${
                  i < completedSteps ? ' done' : i === completedSteps ? ' active' : ''
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Debate turns by round ── */}
      {roundNumbers.map((round) => (
        <div key={round} className="round-group">
          <div className="round-header">Round {round}</div>
          {rounds[round].map((turn, i) => {
            const globalIndex = history.indexOf(turn);
            return (
              <TurnCard key={globalIndex} turn={turn} index={globalIndex} />
            );
          })}
        </div>
      ))}

      {/* ── Final Synthesis (only when debate is complete) ── */}
      {synthesis && !isRunning && (
        <SynthesisPanel
          synthesis={synthesis}
          strengthScores={strengthScores}
          collapsePoint={collapsePoint}
        />
      )}
    </div>
  );
}
