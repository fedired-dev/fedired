/**
 * Languages Loader
 */

import fs from "node:fs";
import yaml from "js-yaml";

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const languages = [];
const languages_custom = [];

const merge = (...args) =>
	args.reduce(
		(a, c) => ({
			...a,
			...c,
			...Object.entries(a)
				.filter(([k]) => c && typeof c[k] === "object")
				.reduce((a, [k, v]) => ((a[k] = merge(v, c[k])), a), {}),
		}),
		{},
	);

fs.readdirSync(__dirname).forEach((file) => {
	if (file.includes(".yml")) {
		file = file.slice(0, file.indexOf("."));
		languages.push(file);
	}
});

fs.readdirSync(__dirname + "/../custom/locales").forEach((file) => {
	if (file.includes(".yml")) {
		file = file.slice(0, file.indexOf("."));
		languages_custom.push(file);
	}
});

const primaries = {
	en: "US",
	ja: "JP",
	zh: "CN",
};

// 何故か文字列にバックスペース文字が混入することがあり、YAMLが壊れるので取り除く
const clean = (text) =>
	text.replace(new RegExp(String.fromCodePoint(0x08), "g"), "");

const locales = languages.reduce(
	(a, c) => (
		(a[c] =
			yaml.load(clean(fs.readFileSync(`${__dirname}/${c}.yml`, "utf-8"))) ||
			{}),
		a
	),
	{},
);
const locales_custom = languages_custom.reduce(
	(a, c) => (
		(a[c] =
			yaml.load(
				clean(
					fs.readFileSync(`${__dirname}/../custom/locales/${c}.yml`, "utf-8"),
				),
			) || {}),
		a
	),
	{},
);
Object.assign(locales, locales_custom);

export default Object.entries(locales).reduce(
	(a, [k, v]) => (
		(a[k] = (() => {
			const [lang] = k.split("-");
			return k === "es-ES"
				? v
				: merge(
						locales["es-ES"],
						locales[`${lang}-${primaries[lang]}`] || {},
						v,
					);
		})()),
		a
	),
	{},
);
