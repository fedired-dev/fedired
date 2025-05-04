import { expectType } from "tsd";
import * as fedired from "../src";

describe("API", () => {
	test("success", async () => {
		const cli = new fedired.api.APIClient({
			origin: "https://fedired.test",
			credential: "TOKEN",
		});
		const res = await cli.request("meta", { detail: true });
		expectType<fedired.entities.DetailedInstanceMetadata>(res);
	});

	test("conditional respose type (meta)", async () => {
		const cli = new fedired.api.APIClient({
			origin: "https://fedired.test",
			credential: "TOKEN",
		});

		const res = await cli.request("meta", { detail: true });
		expectType<fedired.entities.DetailedInstanceMetadata>(res);

		const res2 = await cli.request("meta", { detail: false });
		expectType<fedired.entities.LiteInstanceMetadata>(res2);

		const res3 = await cli.request("meta", {});
		expectType<fedired.entities.LiteInstanceMetadata>(res3);

		const res4 = await cli.request("meta", { detail: true as boolean });
		expectType<
			| fedired.entities.LiteInstanceMetadata
			| fedired.entities.DetailedInstanceMetadata
		>(res4);
	});

	test("conditional respose type (users/show)", async () => {
		const cli = new fedired.api.APIClient({
			origin: "https://fedired.test",
			credential: "TOKEN",
		});

		const res = await cli.request("users/show", { userId: "xxxxxxxx" });
		expectType<fedired.entities.UserDetailed>(res);

		const res2 = await cli.request("users/show", { userIds: ["xxxxxxxx"] });
		expectType<fedired.entities.UserDetailed[]>(res2);
	});
});
