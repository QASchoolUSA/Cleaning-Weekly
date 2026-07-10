export type Frequency = "weekly" | "biweekly" | "monthly";
export type DebrisLevel = "light" | "medium" | "heavy";
export type TimeWindow = "morning" | "afternoon" | "flexible";

export const pricingConfig = {
  homeCleaning: {
    base: 129,
    perBed: 15,
    perBath: 10,
    per500SqFt: 12,
    frequency: {
      weekly: 1,
      biweekly: 1.15,
      monthly: 1.35,
    } satisfies Record<Frequency, number>,
  },
  officeCleaning: {
    base: 199,
    per500SqFt: 18,
    perRestroom: 25,
    frequency: {
      weekly: 1,
      biweekly: 1.12,
      monthly: 1.3,
    } satisfies Record<Frequency, number>,
  },
  deepCleaning: {
    multiplier: 1.8,
  },
  moveInOut: {
    base: 249,
    perBed: 25,
    perBath: 20,
    per500SqFt: 18,
  },
  postConstruction: {
    base: 299,
    per500SqFt: 22,
    debris: {
      light: 1,
      medium: 1.25,
      heavy: 1.55,
    } satisfies Record<DebrisLevel, number>,
  },
  airbnbTurnover: {
    base: 119,
    perBed: 12,
    perBath: 10,
    perTurnover: 0.92,
  },
} as const;
