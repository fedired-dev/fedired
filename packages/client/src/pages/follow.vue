<template>
	<div class="mk-follow-page"></div>
</template>

<script lang="ts" setup>
import { acct } from "fedired-js";
import * as os from "@/os";
import { mainRouter } from "@/router";
import { i18n } from "@/i18n";

async function follow(user): Promise<void> {
	const { canceled } = await os.confirm({
		type: "question",
		text: i18n.t("followConfirm", { name: user.name || user.username }),
	});

	if (canceled) {
		window.close();
		return;
	}

	os.apiWithDialog("following/create", {
		userId: user.id,
	});
}

const acctUri = new URL(location.href).searchParams.get("acct");
if (acctUri == null) {
	throw new Error("acct required");
}

let promise;

if (acctUri.startsWith("https://")) {
	promise = os.api("ap/show", {
		uri: acctUri,
	});
	promise.then((res) => {
		if (res.type === "User") {
			follow(res.object);
		} else if (res.type === "Note") {
			mainRouter.push(`/notes/${res.object.id}`);
		} else {
			os.alert({
				type: "error",
				text: "Not a user",
			}).then(() => {
				window.close();
			});
		}
	});
} else {
	promise = os.api("users/show", acct.parse(acctUri));
	promise.then((user) => {
		follow(user);
	});
}

os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);
</script>
