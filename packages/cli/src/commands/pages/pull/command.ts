import { CLIError, number, positional } from "@superset/cli-framework";
import { type CliContext, command } from "../../../lib/command";
import { pageRefFromArg } from "../pageRef";
import { publicPageInstead } from "../publicPage";

const DOWNLOAD_TIMEOUT_MS = 30_000;

function downloadFailed(version: number, cause: unknown): CLIError {
	const detail =
		cause instanceof Error && cause.name === "TimeoutError"
			? `The blob store did not respond within ${DOWNLOAD_TIMEOUT_MS / 1000}s`
			: cause instanceof Error
				? cause.message
				: String(cause);
	return new CLIError(`Could not download version ${version}`, detail);
}

async function download(url: string, version: number): Promise<ArrayBuffer> {
	try {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
		});
		if (!response.ok) {
			throw new CLIError(
				`Could not download version ${version}`,
				`The blob store answered ${response.status}`,
			);
		}
		return await response.arrayBuffer();
	} catch (error) {
		if (error instanceof CLIError) throw error;
		throw downloadFailed(version, error);
	}
}

async function locateVersion(
	ctx: CliContext,
	arg: string,
	requested: number | undefined,
): Promise<{ url: string; version: number }> {
	const ref = pageRefFromArg(arg);
	try {
		const version = await ctx.api.page.pull.query({
			...ref,
			...(requested ? { version: requested } : {}),
		});
		return { url: version.downloadUrl, version: version.version };
	} catch (error) {
		const page = await publicPageInstead(ctx, ref, error);
		if (requested && requested !== page.version) {
			throw new CLIError(
				`Version ${requested} is not public`,
				`From outside its organization, only the version this page serves (${page.version}) can be read`,
			);
		}
		return { url: page.viewUrl, version: page.version };
	}
}

export default command({
	description: "Write a published version's HTML to stdout",
	args: [positional("page").required().desc("Page id, slug or link")],
	options: {
		version: number()
			.alias("v")
			.desc("Version to fetch (defaults to the one currently served)"),
	},
	run: async ({ ctx, args, options }) => {
		const { url, version } = await locateVersion(
			ctx,
			args.page as string,
			options.version,
		);
		process.stdout.write(Buffer.from(await download(url, version)));
		return undefined;
	},
});
