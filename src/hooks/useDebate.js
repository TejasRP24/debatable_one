// ============================================================
//  useDebate.js  —  React Hook for Debate State Management
// ============================================================

import { useState, useCallback } from "react";
import { runDebate, MODELS } from "../utils/debateEngine.js";

const INITIAL_STATE = {
  status: "idle",        // idle | running | swapping | synthesizing | done | error
  phase: null,           // "normal" | "swap"
  currentRound: 0,
  history: [],
  swapHistory: [],
  synthesis: null,
  driftAnalysis: null,
  contradictionScore: null,
  error: null,
};

export function useDebate() {
  const [state, setState] = useState(INITIAL_STATE);

  const updateTurn = useCallback((turnData) => {
    setState((prev) => ({
      ...prev,
      status: turnData.phase === "swap" ? "swapping" : "running",
      phase: turnData.phase,
      currentRound: turnData.round,
      history: turnData.phase === "normal"
        ? [...prev.history, turnData]
        : prev.history,
      swapHistory: turnData.phase === "swap"
        ? [...prev.swapHistory, turnData]
        : prev.swapHistory,
    }));
  }, []);

  const startDebate = useCallback(async ({
    topic,
    positiveModel,
    negativeModel,
    rounds,
    enableRoleSwap,
  }) => {
    setState({ ...INITIAL_STATE, status: "running" });

    try {
      const result = await runDebate({
        topic,
        positiveModel,
        negativeModel,
        rounds,
        enableRoleSwap,
        onTurnComplete: updateTurn,
      });

      setState((prev) => ({
        ...prev,
        status: "done",
        synthesis: result.synthesis,
        driftAnalysis: result.driftAnalysis,
        contradictionScore: result.contradictionScore,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err.message,
      }));
    }
  }, [updateTurn]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    startDebate,
    reset,
    isRunning: state.status === "running" || state.status === "swapping",
    isDone: state.status === "done",
    isError: state.status === "error",
  };
}