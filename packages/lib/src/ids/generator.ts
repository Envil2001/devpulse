import { init } from '@paralleldrive/cuid2';

import { type IdTypePrefixes, idTypes, type TypeId } from './types.js';

const TYPEID_LENGTH = 26;

const createId: () => string = init({ length: TYPEID_LENGTH });

export const typeIdGenerator = <T extends IdTypePrefixes>(prefix: T): TypeId<T> => {
  return `${idTypes[prefix]}_${createId()}` as TypeId<T>;
};
