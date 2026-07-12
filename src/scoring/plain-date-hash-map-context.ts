import { HashMap } from '@rimbu/hashed';
import { Hasher } from '@rimbu/hashed/common';

const PlainDateStringHasher = Hasher.stringHasher();

export const PlainDateHashMapContext =
  HashMap.createContext<Temporal.PlainDate>({
    hasher: {
      isValid: (value): value is Temporal.PlainDate =>
        value instanceof Temporal.PlainDate,
      hash: (value) => PlainDateStringHasher.hash(value.toString()),
    },
    eq: (left, right) => left.toString() === right.toString(),
  });
