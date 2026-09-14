export const nonEmptyString = (value: unknown, label: string) => {
	if (typeof value !== "string" || !value.trim())
		throw new Error(`${label} must be a non-empty string`);
	return value.trim();
};
export const stringArray = (value: unknown, label: string) => {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
		throw new Error(`${label} must be an array of strings`);
	return value.map((item) => item.trim()).filter(Boolean);
};
export const boundedString = (value: unknown, label: string, limit: number) => {
	const result = nonEmptyString(value, label);
	if (result.length > limit) throw new Error(`${label} must not exceed ${limit} characters`);
	return result;
};
export const boundedStringArray = (
	value: unknown,
	label: string,
	limit: number,
	maximum: number,
) => {
	const values = stringArray(typeof value === "string" ? [value] : (value ?? []), label);
	if (values.length > maximum) throw new Error(`${label} must contain at most ${maximum} entries`);
	return values.map((item, index) => boundedString(item, `${label}[${index}]`, limit));
};
export const objectRecord = (value: unknown, label: string) => {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`${label} must be an object`);
	return value as Record<string, unknown>;
};
export const boundedArray = <T>(
	value: unknown,
	label: string,
	maximum: number,
	convert: (item: unknown, index: number) => T,
) => {
	const values = value ?? [];
	if (!Array.isArray(values)) throw new Error(`${label} must be an array`);
	if (values.length > maximum) throw new Error(`${label} must contain at most ${maximum} entries`);
	return values.map(convert);
};
