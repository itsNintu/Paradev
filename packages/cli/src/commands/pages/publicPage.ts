import { TRPCClientError } from "@trpc/client";

function pageNotFound(error: unknown): boolean {
	if (!(error instanceof TRPCClientError)) return false;
	const data = error.data as { i18nKey?: string | null } | null;
	return data?.i18nKey === "serverError.page.pageNotFound";
}

/**
 * A page anyone with the link can see is often outside the caller's
 * organizations, so the organization lookup misses it.
 */
export async function publicFallback<T>(
	ref: { id: string } | { slug: string },
	error: unknown,
	read: (slug: string) => Promise<T | null>,
): Promise<T> {
	if (!("slug" in ref) || !pageNotFound(error)) throw error;
	const page = await read(ref.slug).catch(() => null);
	if (!page) throw error;
	return page;
}
