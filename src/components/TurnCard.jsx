export default function TurnCard({ turn, index }) {
  const isPro = turn.role === 'positive';
  const side  = isPro ? 'pro' : 'con';
  const animClass = isPro ? 'anim-slide-l' : 'anim-slide-r';

  return (
    <div
      id={`turn-card-${index}`}
      className={`turn-card ${side} ${animClass}`}
      style={{ animationDelay: `${(index % 2) * 80}ms` }}
    >
      {/* Header */}
      <div className="turn-card-header">
        <span className={`badge badge-${side}`}>
          <span>{isPro ? '✅' : '❌'}</span>
          {isPro ? 'For the Claim' : 'Against the Claim'}
        </span>
        <span className="turn-model-name">{turn.model}</span>
        <span className="turn-round">Round {turn.round}</span>
      </div>

      {/* Argument text */}
      <p className="turn-content">{turn.content}</p>

      {/* Footer: score + citations */}
      <div className="turn-footer">
        {/* Score bar */}
        <div className="turn-score-wrap">
          <span className="turn-score-label">Strength</span>
          <div className="turn-score-track">
            <div
              className={`turn-score-fill ${side}`}
              style={{ width: `${(turn.score / 10) * 100}%` }}
            />
          </div>
          <span className={`turn-score-val text-${side}`}>{turn.score}/10</span>
        </div>

        {/* Citation tags */}
        {turn.citations && turn.citations.length > 0 && (
          <div className="citations-wrap">
            {turn.citations.slice(0, 4).map((c, i) => (
              <span key={i} className={`citation-tag ${c.type}`} title={c.text}>
                {c.type === 'section' ? '§' : c.type === 'act' ? '📜' : '⚖️'}{' '}
                {c.text.length > 28 ? c.text.slice(0, 28) + '…' : c.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
