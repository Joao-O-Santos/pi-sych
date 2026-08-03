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
