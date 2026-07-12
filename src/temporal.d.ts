declare namespace Temporal {
  interface PlainDate {}
}

declare const Temporal: {
  readonly PlainDate: {
    from(isoDate: string): Temporal.PlainDate;
  };
};
