import { describe, expect, test } from "bun:test";
import { TRPCClientError } from "@trpc/client";
import type { CliContext } from "../../lib/command";
import { publicPageInstead } from "./publicPage";

const PUBLIC_PAGE = { slug: "q3", version: 1, viewUrl: "https://frame/v1/" };

function trpcError(code: string, i18nKey: string | null) {
	return new TRPCClientError("refused", {
		result: {
			error: { message: "refused", code: -1, data: { code, i18nKey } },
		},
	});
}

function apiWith(publicView: unknown) {
	const asked: unknown[] = [];
	const ctx = {
		api: {
			page: {
				publicView: {
					query: async (input: unknown) => {
						asked.push(input);
						return publicView;
					},
				},
			},
		},
	} as unknown as Pick<CliContext, "api">;
	return { ctx, asked };
}

describe("publicPageInstead", () => {
	test("returns the public page when the organization lookup misses it", async () => {
		const { ctx } = apiWith(PUBLIC_PAGE);
		const missed = trpcError("NOT_FOUND", "serverError.page.pageNotFound");
		expect(await publicPageInstead(ctx, { slug: "q3" }, missed)).toEqual(
			PUBLIC_PAGE as never,
		);
	});

	test("keeps the original error when the page is not public", async () => {
		const { ctx } = apiWith(null);
		const otherOrg = trpcError("FORBIDDEN", null);
		await expect(publicPageInstead(ctx, { slug: "q3" }, otherOrg)).rejects.toBe(
			otherOrg,
		);
	});

	test("does not hide a missing version behind the public one", async () => {
		const { ctx, asked } = apiWith(PUBLIC_PAGE);
		const noVersion = trpcError("NOT_FOUND", null);
		await expect(
			publicPageInstead(ctx, { slug: "q3" }, noVersion),
		).rejects.toBe(noVersion);
		expect(asked).toEqual([]);
	});
});
