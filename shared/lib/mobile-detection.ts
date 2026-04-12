const PHONE_USER_AGENT_PATTERN =
  /iPhone|iPod|Windows Phone|IEMobile|Opera Mini|BlackBerry|BB10|Android.+Mobile|Mobile\b/i;
const TABLET_USER_AGENT_PATTERN =
  /iPad|Tablet|Kindle|Silk|PlayBook|Nexus 7|Nexus 9|SM-T|Tab/i;
const TV_USER_AGENT_PATTERN = /SmartTV|SMART-TV|HbbTV|AFT|BRAVIA|GoogleTV|CrKey|TV/i;

export function isLikelyMobileUserAgent(userAgent: string) {
  if (!userAgent) {
    return false;
  }

  if (TABLET_USER_AGENT_PATTERN.test(userAgent) || TV_USER_AGENT_PATTERN.test(userAgent)) {
    return false;
  }

  return PHONE_USER_AGENT_PATTERN.test(userAgent);
}

export function isLikelyMobileClient() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent ?? "";
  const shortestScreenSide = Math.min(window.screen.width, window.screen.height);
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return isLikelyMobileUserAgent(userAgent) && hasCoarsePointer && shortestScreenSide <= 430;
}
