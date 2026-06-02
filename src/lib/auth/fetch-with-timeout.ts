export const FETCH_TIMEOUT_MS = 5000;

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  let isTimeout = false;
  const timeoutId = setTimeout(() => {
    isTimeout = true;
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  const incomingSignal = options.signal;
  const handleAbort = () => {
    controller.abort();
  };

  if (incomingSignal) {
    if (incomingSignal.aborted) {
      controller.abort();
    } else {
      incomingSignal.addEventListener("abort", handleAbort);
    }
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      if (isTimeout) {
        throw new Error(`요청 시간 초과: ${url}`);
      }
      if (incomingSignal && incomingSignal.aborted) {
        throw err;
      }
      throw new Error(`요청 시간 초과: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (incomingSignal) {
      incomingSignal.removeEventListener("abort", handleAbort);
    }
  }
}
