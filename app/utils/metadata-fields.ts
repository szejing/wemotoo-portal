export type MetadataFieldType = 'string' | 'number' | 'boolean' | 'json';

export type MetadataField = {
	key: string;
	type: MetadataFieldType;
	value: string | number | boolean;
};

export type BuildMetadataResult =
	| {
			ok: true;
			metadata: Record<string, unknown> | undefined;
	  }
	| {
			ok: false;
			key: string;
			message: string;
	  };

const getFieldType = (value: unknown): MetadataFieldType => {
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	if (typeof value === 'string') return 'string';
	return 'json';
};

const getFieldValue = (value: unknown, type: MetadataFieldType) => {
	if (type === 'json') return JSON.stringify(value ?? null, null, 2);
	return value as string | number | boolean;
};

export const createMetadataFields = (metadata?: Record<string, unknown>): MetadataField[] => {
	return Object.entries(metadata ?? {}).map(([key, value]) => {
		const type = getFieldType(value);

		return {
			key,
			type,
			value: getFieldValue(value, type),
		};
	});
};

export const buildMetadata = (fields: MetadataField[]): BuildMetadataResult => {
	if (fields.length === 0) {
		return { ok: true, metadata: undefined };
	}

	const metadata: Record<string, unknown> = {};

	for (const field of fields) {
		if (field.type === 'number') {
			const value = Number(field.value);
			if (Number.isNaN(value)) {
				return {
					ok: false,
					key: field.key,
					message: 'Metadata value must be a number.',
				};
			}
			metadata[field.key] = value;
			continue;
		}

		if (field.type === 'json') {
			try {
				metadata[field.key] = JSON.parse(String(field.value));
				continue;
			} catch {
				return {
					ok: false,
					key: field.key,
					message: 'Metadata value must be valid JSON.',
				};
			}
		}

		metadata[field.key] = field.value;
	}

	return { ok: true, metadata };
};
