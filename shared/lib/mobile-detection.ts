const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export function isLikelyMobileUserAgent(userAgent: string) {
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}
