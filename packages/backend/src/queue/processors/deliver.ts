import { URL } from "node:url";
import request from "@/remote/activitypub/request.js";
import { registerOrFetchInstanceDoc } from "@/services/register-or-fetch-instance-doc.js";
import Logger from "@/services/logger.js";
import { Instances } from "@/models/index.js";
import { fetchInstanceMetadata } from "@/services/fetch-instance-metadata.js";
import { toPuny } from "backend-rs";
import { StatusError } from "@/misc/fetch.js";
import { shouldSkipInstance } from "@/misc/skipped-instances.js";
import type { DeliverJobData } from "@/queue/types.js";
import type Bull from "bull";

const logger = new Logger("deliver");

let latest: string | null = null;

export default async (job: Bull.Job<DeliverJobData>) => {
	const { host } = new URL(job.data.to);
	const puny = toPuny(host);

	if (await shouldSkipInstance(puny)) return "skip";

	try {
		if (latest !== (latest = JSON.stringify(job.data.content, null, 2))) {
			logger.debug(`delivering ${latest}`);
		}

		await request(job.data.user, job.data.to, job.data.content);

		// Update stats
		registerOrFetchInstanceDoc(host).then((i) => {
			Instances.update(i.id, {
				latestRequestSentAt: new Date(),
				latestStatus: 200,
				lastCommunicatedAt: new Date(),
				isNotResponding: false,
			});

			fetchInstanceMetadata(i);
		});

		return "Success";
	} catch (res) {
		// Update stats
		registerOrFetchInstanceDoc(host).then((i) => {
			Instances.update(i.id, {
				latestRequestSentAt: new Date(),
				latestStatus: res instanceof StatusError ? res.statusCode : null,
				isNotResponding: true,
			});
		});

		if (res instanceof StatusError) {
			// 4xx
			if (!res.isRetryable) {
				// HTTPステータスコード4xxはクライアントエラーであり、それはつまり
				// 何回再送しても成功することはないということなのでエラーにはしないでおく
				return `${res.statusCode} ${res.statusMessage}`;
			}

			// 5xx etc.
			throw new Error(`${res.statusCode} ${res.statusMessage}`);
		} else {
			// DNS error, socket error, timeout ...
			throw res;
		}
	}
};
