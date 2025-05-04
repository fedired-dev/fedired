// TODO: use fedired-js
import { Schema as _Schema } from "fedired-js";

export const refs = _Schema.refs;
export type Packed<T extends keyof typeof refs> = _Schema.Packed<T>;
export type Schema = _Schema.Schema;
export type SchemaType<P extends _Schema.Schema> = _Schema.SchemaType<P>;
