import { noteVisibilities } from "fedired-js";
import type { NoteVisibility } from "@/types/note";

export const noteVisibilitiesClient = (
	noteVisibilities as readonly NoteVisibility[]
).concat("private");
