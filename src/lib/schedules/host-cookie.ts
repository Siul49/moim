export const HOST_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

export function getHostTokenCookieName(scheduleId: string): string {
  return `moim_host_${scheduleId}`;
}
