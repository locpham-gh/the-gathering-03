export const GENDERS = ["male", "female", "other"] as const;
export type Gender = (typeof GENDERS)[number];
export const CHARACTER_2D = ["Adam", "Alex", "Amelia", "Bob"] as const;
export type Character2D = (typeof CHARACTER_2D)[number];

const DEFAULT_AVATAR_BY_GENDER: Record<Gender, string> = {
  male: "/assets/avatars/default-male.png",
  female: "/assets/avatars/default-female.png",
  other: "/assets/avatars/default-male.png",
};

const DEFAULT_CHARACTER_BY_GENDER: Record<Gender, Character2D> = {
  male: "Adam",
  female: "Amelia",
  other: "Alex",
};

export const sanitizeGender = (value?: string | null): Gender => {
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }
  return "other";
};

export const getDefaultAvatarByGender = (gender?: string | null): string => {
  return DEFAULT_AVATAR_BY_GENDER[sanitizeGender(gender)];
};

export const sanitizeCharacter2D = (
  value?: string | null,
): Character2D => {
  if (value === "Adam" || value === "Alex" || value === "Amelia" || value === "Bob") {
    return value;
  }
  return "Adam";
};

export const getDefaultCharacterByGender = (
  gender?: string | null,
): Character2D => {
  return DEFAULT_CHARACTER_BY_GENDER[sanitizeGender(gender)];
};

export const resolveDisplayName = (
  displayName: string | undefined | null,
  email: string,
): string => {
  const normalized = displayName?.trim();
  return normalized && normalized.length > 0
    ? normalized
    : email.split("@")[0] || "User";
};

export const resolveAvatarUrl = (
  avatarUrl: string | undefined | null,
  gender: string | undefined | null,
): string => {
  const normalized = avatarUrl?.trim();
  return normalized && normalized.length > 0
    ? normalized
    : getDefaultAvatarByGender(gender);
};
