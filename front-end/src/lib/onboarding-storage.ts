/** Set after successful registration to open the complete-profile modal once. */
export const POST_REGISTER_PROFILE_KEY = "ann_open_complete_profile_after_register";

export function setPostRegisterProfilePending(): void {
  try {
    sessionStorage.setItem(POST_REGISTER_PROFILE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function getPostRegisterProfilePending(): boolean {
  try {
    return sessionStorage.getItem(POST_REGISTER_PROFILE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPostRegisterProfilePending(): void {
  try {
    sessionStorage.removeItem(POST_REGISTER_PROFILE_KEY);
  } catch {
    /* ignore */
  }
}
