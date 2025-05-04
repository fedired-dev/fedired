import type { Endpoints } from "./api.types.js";

export type PropertyOfType<Type, U> = keyof {
  [K in keyof Type as Type[K] extends U ? K : never]: K
};

export type EndpointsOf<T> = PropertyOfType<Endpoints, { res: T }>;

export type NonUndefinedAble<T> = T extends undefined ? never : T;
