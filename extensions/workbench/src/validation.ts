export function record(value: unknown, label: string): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value))
		throw new Error(`${label} must be an object`);
	return value as Record<string, unknown>;
}

export function nonEmptyString(value: unknown, label: string) {
	if (typeof value !== "string" || !value.trim())
		throw new Error(`${label} must be a non-empty string`);
	return value.trim();
}

export function stringArray(value: unknown, label: string): string[] {
	if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
	return value.map((item, index) => nonEmptyString(item, `${label}[${index}]`));
}
