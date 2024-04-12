// eslint-disable-next-line no-shadow
export enum ChangeType {
  // The `change` value for updated or inserted fields resulting from shallow diff
  UPDATED = 'updated',
  // The `change` value for removed fields resulting from shallow diff
  REMOVED = 'removed',
  KEYS_UPDATED = 'updated_keys',
  ARRAY_UPDATED = 'updated_array',
}
