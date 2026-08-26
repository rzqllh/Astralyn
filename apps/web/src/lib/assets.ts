import type {
  AssetManifest,
  AssetRecord,
  AssetEntityType,
  AssetVariant,
} from "@astralyn/shared";

// Static import of the manifest for client-side synchronous lookups
import manifestData from "../../public/game-assets/v1.0.0/manifest.json";

export const activeManifest = manifestData as unknown as AssetManifest;

const assetMap = new Map<string, AssetRecord>();

for (const asset of activeManifest.assets) {
  const key = `${asset.entityType}:${asset.entityId.toLowerCase()}:${asset.variant}`;
  assetMap.set(key, asset);

  // Also index without variant for default lookup
  const defaultKey = `${asset.entityType}:${asset.entityId.toLowerCase()}`;
  if (!assetMap.has(defaultKey)) {
    assetMap.set(defaultKey, asset);
  }
}

export function getAssetRecord(
  entityType: AssetEntityType,
  entityId: string,
  variant: AssetVariant = "icon"
): AssetRecord | undefined {
  const key = `${entityType}:${entityId.toLowerCase()}:${variant}`;
  const record = assetMap.get(key);
  if (record && record.usageStatus !== "blocked") {
    return record;
  }
  // Fallback to default variant
  const defaultRecord = assetMap.get(`${entityType}:${entityId.toLowerCase()}`);
  if (defaultRecord && defaultRecord.usageStatus !== "blocked") {
    return defaultRecord;
  }
  return undefined;
}

export function getAssetUrl(
  entityType: AssetEntityType,
  entityId: string,
  variant: AssetVariant = "icon"
): string | undefined {
  const record = getAssetRecord(entityType, entityId, variant);
  return record ? record.localPath : undefined;
}

export function getAllAssets(): AssetRecord[] {
  return activeManifest.assets;
}

export function getAssetsByCategory(entityType: AssetEntityType): AssetRecord[] {
  return activeManifest.assets.filter((a) => a.entityType === entityType);
}
