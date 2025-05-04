import Router from "@koa/router";
import {
	collectDefaultMetrics,
	register,
	Gauge,
	Counter,
	CounterConfiguration,
} from "prom-client";
import config from "./config/index.js";
import { queues } from "./queue/queues.js";
import cluster from "node:cluster";
import Xev from "xev";

const xev = new Xev();

if (config.metrics?.enable) {
	if (cluster.isPrimary) {
		collectDefaultMetrics();

		new Gauge({
			name: "fedired_queue_jobs",
			help: "Amount of jobs in the bull queues",
			labelNames: ["queue", "status"] as const,
			async collect() {
				for (const queue of queues) {
					const counts = await queue.getJobCounts();
					this.set({ queue: queue.name, status: "completed" }, counts.completed);
					this.set({ queue: queue.name, status: "waiting" }, counts.waiting);
					this.set({ queue: queue.name, status: "active" }, counts.active);
					this.set({ queue: queue.name, status: "delayed" }, counts.delayed);
					this.set({ queue: queue.name, status: "failed" }, counts.failed);
				}
			},
		});
	}
}

if (cluster.isPrimary) {
	xev.on("registry-request", async () => {
		try {
			const metrics = await register.metrics();
			xev.emit("registry-response", {
				contentType: register.contentType,
				body: metrics
			});
		} catch (error) {
			xev.emit("registry-response", { error });
		}
	});
}

export const handleMetrics: Router.Middleware = async (ctx) => {
	if (config.metrics?.token !== undefined) {
		if (ctx.query.token === undefined) {
			ctx.res.statusCode = 401;
			ctx.body = "Missing token parameter";
			return;
		}
		const correct = config.metrics.token === ctx.query.token;
		if (!correct) {
			ctx.res.statusCode = 403;
			ctx.body = "Incorrect token";
			return;
		}
	}
	try {
		if (cluster.isPrimary) {
			ctx.set("content-type", register.contentType);
			ctx.body = await register.metrics();
		} else {
			const wait = new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(
					() => reject("Timeout while waiting for cluster master"),
					1000 * 60
				);
				xev.once("registry-response", (response) => {
					clearTimeout(timeout);
					if (response.error) reject(response.error);
					ctx.set("content-type", response.contentType);
					ctx.body = response.body;
					resolve();
				});
			});
			xev.emit("registry-request");
			await wait;
		}
	} catch (err) {
		ctx.res.statusCode = 500;
		ctx.body = err;
	}
};

const counter = (configuration: CounterConfiguration<string>) => {
	if (config.metrics?.enable) {
		if (cluster.isPrimary) {
			const counter = new Counter(configuration);
			counter.reset(); // initialize internal hashmap
			xev.on(`metrics-counter-${configuration.name}`, () => counter.inc());
			return () => counter.inc();
		} else {
			return () => xev.emit(`metrics-counter-${configuration.name}`);
		}
	} else {
		return () => { };
	}
};

export const tickOutbox = counter({
	name: "fedired_outbox_total",
	help: "Total AP outbox calls",
});

export const tickInbox = counter({
	name: "fedired_inbox_total",
	help: "Total AP inbox calls",
});

export const tickFetch = counter({
	name: "fedired_fetch_total",
	help: "Total AP fetch calls",
});

export const tickResolve = counter({
	name: "fedired_resolve_total",
	help: "Total AP resolve calls",
});
