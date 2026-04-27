export default function SynthesisPanel({ synthesis, strengthScores, collapsePoint }) {
  // Parse sections from the Groq structured verdict
  function parseSection(text, heading) {
    const regex = new RegExp(`${heading}\\s*\\n([\\s\\S]*?)(?=\\n[A-Z ]{4,}\\n|$)`, 'i');
    const m = text.match(regex);
    return m ? m[1].trim() : null;
  }

  const sections = [
    { key: 'VERDICT SUMMARY',                   label: 'Verdict Summary',          icon: '🏛️' },
    { key: 'STRONGEST POINTS FOR THE CLAIM',     label: 'Points For the Claim',     icon: '✅' },
    { key: 'STRONGEST POINTS AGAINST THE CLAIM', label: 'Points Against the Claim', icon: '❌' },
    { key: 'ARGUMENT COLLAPSE POINT',            label: 'Argument Collapse Point',  icon: '⚠️' },
    { key: 'HALLUCINATION FLAGS',                label: 'Hallucination Flags',      icon: '🔍' },
    { key: 'RECOMMENDED NEXT STEPS',             label: 'Recommended Next Steps',   icon: '🗺️' },
  ];

  const parsed = sections.map((s) => ({
    ...s,
    content: parseSection(synthesis, s.key),
  })).filter((s) => s.content);

  // Fallback: show raw text if parsing didn't find sections
  const showRaw = parsed.length < 2;

  return (
    <div id="synthesis-panel" className="synthesis-panel">
      {/* Header */}
      <div className="synthesis-header">
        <div className="synthesis-header-icon">⚖️</div>
        <div>
          <h3>Judge's Legal Decision Summary</h3>
          <p>Powered by LLaMA 4 via Groq — neutral evaluation of both sides</p>
        </div>
        <span className="badge badge-judge" style={{ marginLeft: 'auto' }}>Groq Judge</span>
      </div>

      <div className="synthesis-body">
        {showRaw ? (
          <pre className="synthesis-text">{synthesis}</pre>
        ) : (
          parsed.map((s, i) => (
            <div key={i} className="verdict-section">
              <div className="verdict-section-title">{s.icon} {s.label}</div>
              <div className="verdict-block">{s.content}</div>
            </div>
          ))
        )}

        {/* Per-round strength chart */}
        {strengthScores && strengthScores.length > 0 && (
          <div className="strength-chart">
            <div className="strength-chart-title">📊 Argument Strength by Round</div>
            {strengthScores.map((r) => (
              <div key={r.round} className="strength-row">
                <div className="strength-round-label">Round {r.round}</div>
                <div className="strength-bars">
                  <div className="strength-bar-row">
                    <span className="strength-bar-label text-pro">For</span>
                    <div className="strength-bar-track">
                      <div
                        className="strength-bar-fill pro"
                        style={{ width: `${(r.positiveScore / 10) * 100}%` }}
                      />
                    </div>
                    <span className="strength-bar-val text-pro">{r.positiveScore}/10</span>
                  </div>
                  <div className="strength-bar-row">
                    <span className="strength-bar-label text-con">Against</span>
                    <div className="strength-bar-track">
                      <div
                        className="strength-bar-fill con"
                        style={{ width: `${(r.negativeScore / 10) * 100}%` }}
                      />
                    </div>
                    <span className="strength-bar-val text-con">{r.negativeScore}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collapse point alert */}
        {collapsePoint && collapsePoint.score > 0 && (
          <div className="collapse-alert">
            <span className="collapse-icon">🔴</span>
            <div className="collapse-text">
              <strong>Weakest point detected:</strong> {collapsePoint.label}
              {' '}(reactive overlap score: <strong>{collapsePoint.score}%</strong>)
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="disclaimer">
          <span className="disclaimer-icon">ℹ️</span>
          <span>
            <strong>Important Disclaimer:</strong> This is AI-generated legal decision support, not
            legal advice. The arguments and analysis presented may contain errors or unverifiable
            citations. Please consult a licensed advocate before taking any legal action.
          </span>
        </div>
      </div>
    </div>
  );
}
