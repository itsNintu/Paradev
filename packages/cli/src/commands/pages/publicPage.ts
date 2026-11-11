import { TRPCClientError } from "@trpc/client";
import type { CliContext } from "../../lib/command";

type PublicPage = NonNullable<
	Awaited<ReturnType<CliContext["api"]["page"]["publicView"]["query"]>>
>;

function pageHidden(error: unknown): boolean {
	if (!(error instanceof TRPCClientError)) return false;
	const data = error.data as { code?: string; i18nKey?: string | null } | null;
	return (
		data?.code === "FORBIDDEN" ||
		data?.i18nKey === "serverError.page.pageNotFound"
	);
}

/**
 * A page anyone with the link can see is outside the caller's organizations
 * more often than not, so the organization lookup misses it.
 */
export async function publicPageInstead(
	ctx: Pick<CliContext, "api">,
	ref: { id: string } | { slug: string },
	error: unknown,
): Promise<PublicPage> {
	if (!("slug" in ref) || !pageHidden(error)) throw error;
	const page = await ctx.api.page.publicView
		.query({ slug: ref.slug })
		.catch(() => null);
	if (!page) throw error;
	return page;
}
