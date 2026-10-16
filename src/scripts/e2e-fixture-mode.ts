export type E2EFixtureModeInput = {
  development: unknown;
  flag: unknown;
};

export const isE2EFixtureMode = ({ development, flag }: E2EFixtureModeInput): boolean =>
  development === true && flag === 'true';
