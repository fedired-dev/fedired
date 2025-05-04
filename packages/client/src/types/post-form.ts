import type { entities } from "fedired-js";

export interface PollType {
	choices: string[];
	multiple: boolean;
	expiresAt: string | null;
	expiredAfter: number | null;
}

export type NoteDraft = entities.Note & {
	poll?: PollType;
};
