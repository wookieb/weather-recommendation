declare namespace Temporal {
  interface PlainDate {
    toString(): string;
  }
}

declare const Temporal: {
  readonly PlainDate: {
    from(isoDate: string): Temporal.PlainDate;
  };
};
