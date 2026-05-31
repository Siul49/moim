export const FETCH_TIMEOUT_MS = 5000;

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`요청 시간 초과: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
