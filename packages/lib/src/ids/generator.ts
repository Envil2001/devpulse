/* eslint-disable @typescript-eslint/no-unsafe-call */
import { init } from '@paralleldrive/cuid2';

import { type IdTypePrefixes, idTypes, type TypeId } from './types.js';

const TYPEID_LENGTH = 26;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const createId: () => string = init({ length: TYPEID_LENGTH });

export const typeIdGenerator = <T extends IdTypePrefixes>(prefix: T): TypeId<T> => {
  return `${idTypes[prefix]}_${createId()}` as TypeId<T>;
};
