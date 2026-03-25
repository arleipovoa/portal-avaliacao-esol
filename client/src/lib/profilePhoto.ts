const PROFILE_PHOTO_PREFIX = "esol-profile-photo";

function getProfilePhotoKey(userId: number): string {
  return `${PROFILE_PHOTO_PREFIX}:${userId}`;
}

export function getStoredProfilePhoto(userId?: number | null): string | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    return window.localStorage.getItem(getProfilePhotoKey(userId));
  } catch {
    return null;
  }
}

export function setStoredProfilePhoto(userId: number, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getProfilePhotoKey(userId), value);
  } catch {
    // noop
  }
}

export function clearStoredProfilePhoto(userId: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getProfilePhotoKey(userId));
  } catch {
    // noop
  }
}
