import { URL } from "node:url";
import * as mfm from "mfm-js";
import { config } from "@/config.js";
import type { ILocalUser } from "@/models/entities/user.js";
import { DriveFiles, UserProfiles } from "@/models/index.js";
import { getUserKeypair } from "@/misc/keypair-store.js";
import { toHtml } from "@/mfm/to-html.js";
import renderImage from "./image.js";
import renderKey from "./key.js";
import { getEmojis } from "./note.js";
import { renderEmoji, renderHashtag } from "backend-rs";
import type { IIdentifier } from "../models/identifier.js";

export async function renderPerson(user: ILocalUser) {
	const id = `${config.url}/users/${user.id}`;
	const isSystem = !!user.username.match(/\./);

	const [avatar, banner, profile] = await Promise.all([
		user.avatarId
			? DriveFiles.findOneBy({ id: user.avatarId })
			: Promise.resolve(undefined),
		user.bannerId
			? DriveFiles.findOneBy({ id: user.bannerId })
			: Promise.resolve(undefined),
		UserProfiles.findOneByOrFail({ userId: user.id }),
	]);

	const attachment: {
		type: "PropertyValue";
		name: string;
		value: string;
		identifier?: IIdentifier;
	}[] = [];

	if (profile.fields) {
		for (const field of profile.fields) {
			attachment.push({
				type: "PropertyValue",
				name: field.name,
				value: field.value?.match(/^https?:/)
					? `<a href="${
							new URL(field.value).href
						}" rel="me nofollow noopener" target="_blank">${
							new URL(field.value).href
						}</a>`
					: field.value,
			});
		}
	}

	const emojis = await getEmojis(user.emojis);
	const apemojis = emojis.map((emoji) => renderEmoji(emoji));

	const hashtagTags = (user.tags || []).map((tag) => renderHashtag(tag));

	const tag = [...apemojis, ...hashtagTags];

	const keypair = await getUserKeypair(user.id);

	const person = {
		type: isSystem ? "Application" : user.isBot ? "Service" : "Person",
		id,
		inbox: `${id}/inbox`,
		outbox: `${id}/outbox`,
		followers: `${id}/followers`,
		following: `${id}/following`,
		featured: `${id}/collections/featured`,
		sharedInbox: `${config.url}/inbox`,
		endpoints: { sharedInbox: `${config.url}/inbox` },
		url: `${config.url}/@${user.username}`,
		preferredUsername: user.username,
		name: user.name,
		summary: profile.description
			? toHtml(mfm.parse(profile.description))
			: null,
		_misskey_summary: profile.description,
		icon: avatar ? renderImage(avatar) : null,
		image: banner ? renderImage(banner) : null,
		tag,
		manuallyApprovesFollowers: user.isLocked,
		discoverable: !!user.isExplorable,
		publicKey: renderKey(user, keypair, "#main-key"),
		isCat: user.isCat,
		speakAsCat: user.speakAsCat,
		indexable: user.isIndexable,
		attachment: attachment.length ? attachment : undefined,
	} as any;

	if (user.movedToUri) {
		person.movedTo = user.movedToUri;
	}

	if (user.alsoKnownAs) {
		person.alsoKnownAs = user.alsoKnownAs;
	}

	if (profile.birthday) {
		person["vcard:bday"] = profile.birthday;
	}

	if (profile.location) {
		person["vcard:Address"] = profile.location;
	}

	return person;
}
