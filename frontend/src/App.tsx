import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createGame, fetchGame, submitGuess } from "./api";
import type { Game, GuessResult } from "./types";
import "./styles.css";

const GUESS_PATTERN = /^[1-6]{4}$/;

export default function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [guess, setGuess] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const remainingAttempts = useMemo(() => {
    if (!game) return null;
    return game.maxAttempts - game.attemptsUsed;
  }, [game]);

  const handleStartGame = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const newGame = await createGame();
      setGame(newGame);
      setResult(null);
      setGuess("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to start game.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitGuess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!game) return;

    if (!GUESS_PATTERN.test(guess)) {
      setStatusMessage("Guess must be four digits, each from 1 to 6.");
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const guessResult = await submitGuess(game.id, guess);
      const updatedGame = await fetchGame(game.id);
      setResult(guessResult);
      setGame(updatedGame);
      setGuess("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to submit guess.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <p className="eyebrow">Code Breakers</p>
        <h1>Crack the 4-digit code</h1>
        <p className="subtitle">
          Digits are from 1 to 6. Duplicates allowed. You have 10 attempts.
        </p>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Game Control</h2>
          <button type="button" onClick={handleStartGame} disabled={isLoading}>
            {game ? "Restart game" : "Start new game"}
          </button>
        </div>

        {game ? (
          <div className="game-meta">
            <div>
              <span>Status</span>
              <strong>{game.status}</strong>
            </div>
            <div>
              <span>Attempts used</span>
              <strong>{game.attemptsUsed}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{remainingAttempts}</strong>
            </div>
          </div>
        ) : (
          <p className="empty-state">Start a game to begin guessing.</p>
        )}

        {game && (
          <form className="guess-form" onSubmit={handleSubmitGuess}>
            <label htmlFor="guess">Enter guess</label>
            <div className="guess-input">
              <input
                id="guess"
                type="text"
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
              />
              <button type="submit" disabled={isLoading || game.status !== "active"}>
                Submit
              </button>
            </div>
            <small>Pattern: 4 digits, 1-6 only.</small>
          </form>
        )}

        {statusMessage && <p className="status-message">{statusMessage}</p>}
      </section>

      {result && (
        <section className="panel result">
          <h2>Latest result</h2>
          <div className="result-grid">
            <div>
              <span>Guess</span>
              <strong>{result.guess}</strong>
            </div>
            <div>
              <span>Exact</span>
              <strong>{result.hint.exact}</strong>
            </div>
            <div>
              <span>Color only</span>
              <strong>{result.hint.colorOnly}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{result.statusAfterGuess}</strong>
            </div>
          </div>
        </section>
      )}

      {game && (
        <section className="panel history">
          <h2>Guess history</h2>
          {game.guesses.length === 0 ? (
            <p className="empty-state">No guesses yet.</p>
          ) : (
            <ul>
              {game.guesses.map((entry) => (
                <li key={entry.attemptNumber}>
                  <span className="attempt">#{entry.attemptNumber}</span>
                  <span className="guess">{entry.guess}</span>
                  <span className="hint">Exact: {entry.hint.exact}</span>
                  <span className="hint">Color only: {entry.hint.colorOnly}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
