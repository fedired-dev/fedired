import type Koa from "koa";
import { fetchMeta } from "backend-rs";

const manifest = {
	short_name: "Fedired",
	name: "Fedired",
	description:
		"🌎 Fedired: plataforma de redes sociales descentralizada y de código abierto! 🚀",
	start_url: "/",
	scope: "/",
	display: "standalone",
	background_color: "#1f1d2e",
	theme_color: "#6364FF",
	orientation: "natural",
	icons: [
		{
			src: "/static-assets/icons/192.png",
			sizes: "192x192",
			type: "image/png",
			purpose: "any",
		},
		{
			src: "/static-assets/icons/512.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "any",
		},
		{
			src: "/static-assets/icons/maskable.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "maskable",
		},
		{
			src: "/static-assets/icons/monochrome.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "monochrome",
		},
	],
	share_target: {
		action: "/share/",
		params: {
			title: "title",
			text: "text",
			url: "url",
		},
	},
	screenshots: [
		{
			src: "/static-assets/screenshots/1.webp",
			sizes: "1080x2340",
			type: "image/webp",
			platform: "narrow",
			label: "Profile page",
		},
		{
			src: "/static-assets/screenshots/2.webp",
			sizes: "1080x2340",
			type: "image/webp",
			platform: "narrow",
			label: "Posts",
		},
	],
	shortcuts: [
		{
			name: "Notifications",
			short_name: "Notifs",
			url: "/my/notifications",
		},
		{
			name: "Chats",
			url: "/my/messaging",
		},
	],
	categories: ["social"],
};

export const manifestHandler = async (ctx: Koa.Context) => {
	const instanceMeta = await fetchMeta();

	manifest.short_name = instanceMeta.name || "Fedired";
	manifest.name = instanceMeta.name || "Fedired";
	if (instanceMeta.themeColor) manifest.theme_color = instanceMeta.themeColor;

	ctx.set("Cache-Control", "max-age=300");
	ctx.body = manifest;
};
