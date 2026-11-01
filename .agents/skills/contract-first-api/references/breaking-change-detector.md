# Breaking Change Detector

## 1. Defining Breaking Changes

1. Field removal: Deleting an attribute from an API response on which clients depend.
2. Field optionality modification: Changing an optional attribute into a required attribute.
3. Data type change: Modifying attribute types (e.g., `id: string` becoming `id: number` or numeric price becoming string).
4. Enum value modifications: Removing or renaming roles, states, or domain enum values.

## 2. Expand and Contract Protocol

When modifying an existing contract:

- Phase 1 (Expand): Introduce the new field as optional while retaining the legacy field.
- Phase 2 (Migrate): Update client applications to consume the new field.
- Phase 3 (Contract): Remove the legacy deprecated field only after all clients are migrated and deployed.
