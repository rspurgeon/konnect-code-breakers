import type { ApiError, Game, GuessResult } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const CONSUMER_HEADER = "X-Consumer-ID";

function getOwnerId(): string {
  const existing = window.localStorage.getItem("code-breakers-owner");
  if (existing) {
    return existing;
  }
  const generated = crypto.randomUUID();
  window.localStorage.setItem("code-breakers-owner", generated);
  return generated;
}

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    [CONSUMER_HEADER]: getOwnerId()
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.message ?? "Request failed");
  }
  return (await response.json()) as T;
}

export async function createGame(): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: "POST",
    headers: buildHeaders()
  });

  return parseResponse<Game>(response);
}

export async function fetchGame(gameId: number): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
    headers: buildHeaders()
  });

  return parseResponse<Game>(response);
}

export async function submitGuess(gameId: number, guess: string): Promise<GuessResult> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/guesses`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ guess })
  });

  return parseResponse<GuessResult>(response);
}
