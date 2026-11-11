import { positional } from "@superset/cli-framework";
import { command } from "../../../lib/command";
import { pageRefFromArg } from "../pageRef";
import { publicPageInstead } from "../publicPage";

export default command({
	description: "Show a page",
	args: [positional("page").required().desc("Page id, slug or link")],
	run: async ({ ctx, args }) => {
		const ref = pageRefFromArg(args.page as string);
		try {
			return { data: await ctx.api.page.get.query(ref) };
		} catch (error) {
			return { data: await publicPageInstead(ctx, ref, error) };
		}
	},
});
