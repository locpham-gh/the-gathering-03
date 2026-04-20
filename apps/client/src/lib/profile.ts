export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];
export const CHARACTER_2D = ["Adam", "Alex", "Amelia", "Bob"] as const;
export type Character2D = (typeof CHARACTER_2D)[number];

const DEFAULT_AVATAR_BY_GENDER: Record<Gender, string> = {
  male: "/assets/avatars/default-male.png",
  female: "/assets/avatars/default-female.png",
  other: "/assets/avatars/default-male.png",
};

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  gender?: Gender;
  character2d?: Character2D;
}

export const sanitizeGender = (value?: string): Gender => {
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }
  return "other";
};

export const resolveDisplayName = (displayName?: string, email?: string): string => {
  const normalized = displayName?.trim();
  if (normalized && normalized.length > 0) return normalized;
  if (email) return email.split("@")[0] || "User";
  return "User";
};

export const getDefaultAvatarByGender = (gender?: string): string =>
  DEFAULT_AVATAR_BY_GENDER[sanitizeGender(gender)];

export const sanitizeCharacter2D = (value?: string): Character2D => {
  if (value === "Adam" || value === "Alex" || value === "Amelia" || value === "Bob") {
    return value;
  }
  return "Adam";
};

export const getDefaultCharacterByGender = (gender?: string): Character2D => {
  const normalized = sanitizeGender(gender);
  if (normalized === "female") return "Amelia";
  if (normalized === "male") return "Adam";
  return "Alex";
};

export const resolveAvatarUrl = (avatarUrl?: string, gender?: string): string => {
  const normalized = avatarUrl?.trim();
  return normalized && normalized.length > 0
    ? normalized
    : getDefaultAvatarByGender(gender);
};

export const normalizeUserProfile = (user: AppUser): AppUser => {
  const gender = sanitizeGender(user.gender);
  const character2d = user.character2d
    ? sanitizeCharacter2D(user.character2d)
    : getDefaultCharacterByGender(gender);
  return {
    ...user,
    gender,
    character2d,
    displayName: resolveDisplayName(user.displayName, user.email),
    avatarUrl: resolveAvatarUrl(user.avatarUrl, gender),
  };
};
