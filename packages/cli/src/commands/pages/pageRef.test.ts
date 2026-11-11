import { describe, expect, test } from "bun:test";
import { pageRefFromArg } from "./pageRef";

const ID = "60c2d931-0edc-4681-949c-344ed9fa6265";

describe("pageRefFromArg", () => {
	test("reads the slug out of a page link", () => {
		expect(
			pageRefFromArg("https://app.superset.sh/page/q3-pipeline-ab12cd/?v=2"),
		).toEqual({ slug: "q3-pipeline-ab12cd" });
	});

	test("keeps ids and bare slugs as they are", () => {
		expect(pageRefFromArg(ID)).toEqual({ id: ID });
		expect(pageRefFromArg("q3-pipeline")).toEqual({ slug: "q3-pipeline" });
	});
});
