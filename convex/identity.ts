export const MAX_NICKNAME_LENGTH = 24;

export const normalizeNickname = (value: string): { displayName: string; nicknameKey: string } => {
  const displayName = value.normalize('NFKC').trim();
  if (!displayName) throw new Error('nickname-required');
  if ([...displayName].length > MAX_NICKNAME_LENGTH) throw new Error('nickname-too-long');

  return {
    displayName,
    nicknameKey: displayName.toLocaleLowerCase('es'),
  };
};
