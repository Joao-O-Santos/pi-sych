export const nonEmptyString = (value: unknown, label: string): string => {
	if (value == null) throw new Error(`${label} must be a non-empty string`);
	const s = typeof value === "string" ? value : String(value);
	const trimmed = s.trim();
	if (!trimmed) throw new Error(`${label} must be a non-empty string`);
	return trimmed;
};
export const stringArray = (value: unknown, label: string): string[] => {
	if (value === null || value === undefined)
		throw new Error(`${label} must be an array of strings`);
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed ? [trimmed] : [];
	}
	if (!Array.isArray(value)) throw new Error(`${label} must be an array of strings`);
	return value
		.map((item) => {
			if (typeof item === "string") return item.trim();
			if (item != null) return String(item).trim();
			return "";
		})
		.filter(Boolean);
};
