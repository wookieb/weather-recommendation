declare namespace Temporal {
  class PlainDate {
    static from(value: string): PlainDate;
    toString(): string;
  }
}

declare const Temporal: {
  PlainDate: typeof Temporal.PlainDate;
};
