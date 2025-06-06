<template>
	<div class="shaynizk">
		<div class="form">
			<MkInput v-model="name" class="_formBlock">
				<template #label>{{ i18n.ts.name }}</template>
			</MkInput>
			<MkSelect v-model="src" class="_formBlock">
				<template #label>{{ i18n.ts.antennaSource }}</template>
				<option value="all">{{ i18n.ts._antennaSources.all }}</option>
				<!--<option value="home">{{ i18n.ts._antennaSources.homeTimeline }}</option>-->
				<option value="users">
					{{ i18n.ts._antennaSources.users }}
				</option>
				<!--<option value="list">{{ i18n.ts._antennaSources.userList }}</option>-->
				<!--<option value="group">{{ i18n.ts._antennaSources.userGroup }}</option>-->
				<option value="instances">
					{{ i18n.ts._antennaSources.instances }}
				</option>
			</MkSelect>
			<MkSelect
				v-if="src === 'list'"
				v-model="userListId"
				class="_formBlock"
			>
				<template #label>{{ i18n.ts.userList }}</template>
				<option
					v-for="list in userLists"
					:key="list.id"
					:value="list.id"
				>
					{{ list.name }}
				</option>
			</MkSelect>
			<MkSelect
				v-else-if="src === 'group'"
				v-model="userGroupId"
				class="_formBlock"
			>
				<template #label>{{ i18n.ts.userGroup }}</template>
				<option
					v-for="group in userGroups"
					:key="group.id"
					:value="group.id"
				>
					{{ group.name }}
				</option>
			</MkSelect>
			<MkTextarea
				v-else-if="src === 'users'"
				v-model="users"
				class="_formBlock"
			>
				<template #label>{{ i18n.ts.users }}</template>
				<template #caption
					>{{ i18n.ts.antennaUsersDescription }}
					<button class="_textButton" @click="addUser">
						{{ i18n.ts.addUser }}
					</button></template
				>
			</MkTextarea>
			<MkTextarea
				v-else-if="src === 'instances'"
				v-model="instances"
				class="_formBlock"
			>
				<template #label>{{ i18n.ts.instances }}</template>
				<template #caption
					>{{ i18n.ts.antennaInstancesDescription }}
					<button class="_textButton" @click="addInstance">
						{{ i18n.ts.addInstance }}
					</button></template
				>
			</MkTextarea>
			<MkSwitch v-model="withReplies" class="_formBlock">{{
				i18n.ts.withReplies
			}}</MkSwitch>
			<MkTextarea v-model="keywords" class="_formBlock">
				<template #label>{{ i18n.ts.antennaKeywords }}</template>
				<template #caption>{{
					i18n.ts.antennaKeywordsDescription
				}}</template>
			</MkTextarea>
			<MkTextarea v-model="excludeKeywords" class="_formBlock">
				<template #label>{{ i18n.ts.antennaExcludeKeywords }}</template>
				<template #caption>{{
					i18n.ts.antennaKeywordsDescription
				}}</template>
			</MkTextarea>
			<MkSwitch v-model="caseSensitive" class="_formBlock">{{
				i18n.ts.caseSensitive
			}}</MkSwitch>
			<MkSwitch v-model="withFile" class="_formBlock">{{
				i18n.ts.withFileAntenna
			}}</MkSwitch>
			<MkSwitch v-model="notify" class="_formBlock">{{
				i18n.ts.notifyAntenna
			}}</MkSwitch>
		</div>
		<div class="actions">
			<MkButton inline primary @click="saveAntenna()"
				><i :class="icon('ph-floppy-disk-back')"></i>
				{{ i18n.ts.save }}</MkButton
			>
			<MkButton
				v-if="antenna.id != null"
				inline
				danger
				@click="deleteAntenna()"
				><i :class="icon('ph-trash')"></i>
				{{ i18n.ts.delete }}</MkButton
			>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { acct } from "fedired-js";
import MkButton from "@/components/MkButton.vue";
import MkInput from "@/components/form/input.vue";
import MkTextarea from "@/components/form/textarea.vue";
import MkSelect from "@/components/form/select.vue";
import MkSwitch from "@/components/form/switch.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = defineProps<{
	antenna: any;
}>();

const emit = defineEmits<{
	(ev: "created"): void;
	(ev: "updated"): void;
	(ev: "deleted"): void;
}>();

const name = ref<string>(props.antenna.name);
const src = ref<string>(props.antenna.src);
const userListId = ref(props.antenna.userListId);
const userGroupId = ref(props.antenna.userGroupId);
const users = ref<string>(props.antenna.users.join("\n"));
const instances = ref<string>(props.antenna.instances.join("\n"));
const keywords = ref<string>(
	props.antenna.keywords.map((x) => x.join(" ")).join("\n"),
);
const excludeKeywords = ref<string>(
	props.antenna.excludeKeywords.map((x) => x.join(" ")).join("\n"),
);
const caseSensitive = ref<boolean>(props.antenna.caseSensitive);
const withReplies = ref<boolean>(props.antenna.withReplies);
const withFile = ref<boolean>(props.antenna.withFile);
const notify = ref<boolean>(props.antenna.notify);
const userLists = ref<any>(null);
const userGroups = ref<any>(null);

watch(
	() => src.value,
	async () => {
		if (src.value === "list" && userLists.value === null) {
			userLists.value = await os.api("users/lists/list");
		}

		if (src.value === "group" && userGroups.value === null) {
			const groups1 = await os.api("users/groups/owned");
			const groups2 = await os.api("users/groups/joined");

			userGroups.value = [...groups1, ...groups2];
		}
	},
);

async function saveAntenna() {
	const antennaData = {
		name: name.value,
		src: src.value,
		userListId: userListId.value,
		userGroupId: userGroupId.value,
		withReplies: withReplies.value,
		withFile: withFile.value,
		notify: notify.value,
		caseSensitive: caseSensitive.value,
		users: users.value
			.trim()
			.split("\n")
			.map((x) => x.trim()),
		instances: instances.value
			.trim()
			.split("\n")
			.map((x) => x.trim()),
		keywords: keywords.value
			.trim()
			.split("\n")
			.map((x) => x.trim().split(" ")),
		excludeKeywords: excludeKeywords.value
			.trim()
			.split("\n")
			.map((x) => x.trim().split(" ")),
	};

	if (props.antenna.id == null) {
		await os.apiWithDialog("antennas/create", antennaData);
		emit("created");
	} else {
		antennaData.antennaId = props.antenna.id;
		await os.apiWithDialog("antennas/update", antennaData);
		emit("updated");
	}
}

async function deleteAntenna() {
	const { canceled } = await os.confirm({
		type: "warning",
		text: i18n.t("removeAreYouSure", { x: props.antenna.name }),
	});
	if (canceled) return;

	await os.api("antennas/delete", {
		antennaId: props.antenna.id,
	});

	os.success();
	emit("deleted");
}

function addUser() {
	os.selectUser().then((user) => {
		users.value = users.value.trim();
		users.value += `\n@${acct.toString(user as any)}`;
		users.value = users.value.trim();
	});
}

function addInstance() {
	os.selectInstance().then((instance) => {
		instances.value = instances.value.trim();
		instances.value += "\n" + instance.host;
		instances.value = instances.value.trim();
	});
}
</script>

<style lang="scss" scoped>
.shaynizk {
	> .form {
		padding: 32px;
	}

	> .actions {
		padding-block-start: 24px;
		padding-block-end: 80px;
		padding-inline: 32px;
		border-block-start: solid 0.5px var(--divider);
	}
}
</style>
