import { RRule, Frequency } from "rrule";
import { addMinutes, differenceInMinutes } from "date-fns";

export interface RecurrenceConfig {
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom";
  interval?: number;
  byDay?: number[];
  byMonthDay?: number[];
  endType?: "never" | "count" | "until";
  count?: number;
  until?: Date;
}

const FREQ_MAP: Record<string, Frequency> = {
  daily: Frequency.DAILY,
  weekly: Frequency.WEEKLY,
  biweekly: Frequency.WEEKLY,
  monthly: Frequency.MONTHLY,
  yearly: Frequency.YEARLY,
  custom: Frequency.WEEKLY,
};

const DAY_MAP = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];

export function buildRRule(config: RecurrenceConfig): string {
  const options: Partial<InstanceType<typeof RRule>["options"]> = {
    freq: FREQ_MAP[config.frequency] ?? Frequency.WEEKLY,
    interval: config.frequency === "biweekly" ? 2 : config.interval ?? 1,
  };

  if (config.byDay && config.byDay.length > 0) {
    (options as Record<string, unknown>).byweekday = config.byDay.map((d) => DAY_MAP[d]);
  }

  if (config.byMonthDay && config.byMonthDay.length > 0) {
    options.bymonthday = config.byMonthDay;
  }

  if (config.endType === "count" && config.count) {
    options.count = config.count;
  } else if (config.endType === "until" && config.until) {
    options.until = config.until;
  }

  const rule = new RRule(options);
  return rule.toString().replace("RRULE:", "");
}

export function parseRRule(rruleString: string): RecurrenceConfig {
  const rule = RRule.fromString(`RRULE:${rruleString}`);
  const opts = rule.options;

  let frequency: RecurrenceConfig["frequency"] = "weekly";
  if (opts.freq === Frequency.DAILY) frequency = "daily";
  else if (opts.freq === Frequency.WEEKLY && opts.interval === 2) frequency = "biweekly";
  else if (opts.freq === Frequency.WEEKLY) frequency = "weekly";
  else if (opts.freq === Frequency.MONTHLY) frequency = "monthly";
  else if (opts.freq === Frequency.YEARLY) frequency = "yearly";

  if (opts.interval > 1 && frequency !== "biweekly") {
    frequency = "custom";
  }

  const config: RecurrenceConfig = { frequency };

  if (opts.interval && opts.interval > 1) config.interval = opts.interval;

  if (opts.byweekday && opts.byweekday.length > 0) {
    config.byDay = opts.byweekday.map((d: number | { weekday: number }) =>
      typeof d === "number" ? d : d.weekday
    );
  }

  if (opts.bymonthday && opts.bymonthday.length > 0) {
    config.byMonthDay = opts.bymonthday;
  }

  if (opts.count) {
    config.endType = "count";
    config.count = opts.count;
  } else if (opts.until) {
    config.endType = "until";
    config.until = opts.until;
  } else {
    config.endType = "never";
  }

  return config;
}

export interface ExpandedOccurrence {
  occurrenceDate: Date;
  startTime: Date;
  endTime: Date;
}

export function expandRecurrence(
  rruleString: string,
  dtstart: Date,
  duration: number,
  rangeStart: Date,
  rangeEnd: Date
): ExpandedOccurrence[] {
  // Parse the RRULE string into options and construct with dtstart
  // so that day 0 (the original event date) is included in occurrences
  const parsedOptions = RRule.parseString(`RRULE:${rruleString}`);
  const rule = new RRule({
    ...parsedOptions,
    dtstart,
  });

  const dates = rule.between(rangeStart, rangeEnd, true);

  return dates.map((date) => ({
    occurrenceDate: date,
    startTime: date,
    endTime: addMinutes(date, duration),
  }));
}

export function describeRRule(rruleString: string): string {
  try {
    const rule = RRule.fromString(`RRULE:${rruleString}`);
    return rule.toText();
  } catch {
    return "Custom recurrence";
  }
}

export function getPresetRRule(
  preset: string,
  dayOfWeek?: number
): string | null {
  switch (preset) {
    case "none":
      return null;
    case "daily":
      return "FREQ=DAILY";
    case "weekly":
      return dayOfWeek !== undefined
        ? `FREQ=WEEKLY;BYDAY=${["MO", "TU", "WE", "TH", "FR", "SA", "SU"][dayOfWeek]}`
        : "FREQ=WEEKLY";
    case "biweekly":
      return dayOfWeek !== undefined
        ? `FREQ=WEEKLY;INTERVAL=2;BYDAY=${["MO", "TU", "WE", "TH", "FR", "SA", "SU"][dayOfWeek]}`
        : "FREQ=WEEKLY;INTERVAL=2";
    case "monthly":
      return "FREQ=MONTHLY";
    case "yearly":
      return "FREQ=YEARLY";
    default:
      return null;
  }
}
