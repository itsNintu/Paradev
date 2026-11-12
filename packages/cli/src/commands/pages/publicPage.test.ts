import { describe, expect, test } from "bun:test";
import { TRPCClientError } from "@trpc/client";
import { publicFallback } from "./publicPage";

const PUBLIC_PAGE = { slug: "q3", version: 1 };

function trpcError(code: string, i18nKey: string | null) {
	return new TRPCClientError("refused", {
		result: {
			error: { message: "refused", code: -1, data: { code, i18nKey } },
		},
	});
}

const pageMissing = () =>
	trpcError("NOT_FOUND", "serverError.page.pageNotFound");

function reader(result: typeof PUBLIC_PAGE | null) {
	const asked: string[] = [];
	const read = async (slug: string) => {
		asked.push(slug);
		return result;
	};
	return { read, asked };
}

describe("publicFallback", () => {
	test("reads the public page when the organization lookup misses it", async () => {
		const { read, asked } = reader(PUBLIC_PAGE);
		expect(await publicFallback({ slug: "q3" }, pageMissing(), read)).toEqual(
			PUBLIC_PAGE,
		);
		expect(asked).toEqual(["q3"]);
	});

	test("keeps the original error when the page is not public", async () => {
		const { read } = reader(null);
		const missing = pageMissing();
		await expect(publicFallback({ slug: "q3" }, missing, read)).rejects.toBe(
			missing,
		);
	});

	test("keeps the switch-organization error for a member of the page's organization", async () => {
		const { read, asked } = reader(PUBLIC_PAGE);
		const otherOrg = trpcError("FORBIDDEN", null);
		await expect(publicFallback({ slug: "q3" }, otherOrg, read)).rejects.toBe(
			otherOrg,
		);
		expect(asked).toEqual([]);
	});

	test("does not hide a missing version behind the public one", async () => {
		const { read, asked } = reader(PUBLIC_PAGE);
		const noVersion = trpcError("NOT_FOUND", null);
		await expect(publicFallback({ slug: "q3" }, noVersion, read)).rejects.toBe(
			noVersion,
		);
		expect(asked).toEqual([]);
	});

	test("keeps the original error when the public read fails", async () => {
		const missing = pageMissing();
		const read = async () => {
			throw new Error("No procedure found");
		};
		await expect(publicFallback({ slug: "q3" }, missing, read)).rejects.toBe(
			missing,
		);
	});
});
