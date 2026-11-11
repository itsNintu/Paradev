const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_PATH = /^\/page\/([^/]+)\/?$/;

function slugFromPageLink(value: string): string | null {
	if (!URL.canParse(value)) return null;
	const match = PAGE_PATH.exec(new URL(value).pathname);
	return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function pageRefFromArg(
	value: string,
): { id: string } | { slug: string } {
	const ref = slugFromPageLink(value) ?? value;
	return UUID.test(ref) ? { id: ref } : { slug: ref };
}
