import type {
  AssetManifest,
  AssetRecord,
  AssetEntityType,
  AssetVariant,
} from "@astralyn/shared";

// Static import of the dev manifest for client-side dev inspection
import manifestData from "./game-assets/v1.0.0/manifest.json";

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
  const normalizedId = entityId.toLowerCase();

  // 1. Exact match on entityType + entityId + variant
  const exactKey = `${entityType}:${normalizedId}:${variant}`;
  const record = assetMap.get(exactKey);
  if (record && record.usageStatus !== "blocked") {
    return record;
  }

  // 2. Default variant for entityType + entityId
  const defaultRecord = assetMap.get(`${entityType}:${normalizedId}`);
  if (defaultRecord && defaultRecord.usageStatus !== "blocked") {
    return defaultRecord;
  }

  // 3. Fallback across character visual variants (preview -> icon -> portrait)
  if (entityType === "character_preview") {
    const iconRecord = assetMap.get(`character_icon:${normalizedId}`);
    if (iconRecord && iconRecord.usageStatus !== "blocked") return iconRecord;
    const portraitRecord = assetMap.get(`character_portrait:${normalizedId}`);
    if (portraitRecord && portraitRecord.usageStatus !== "blocked") return portraitRecord;
  } else if (entityType === "character_icon") {
    const previewRecord = assetMap.get(`character_preview:${normalizedId}`);
    if (previewRecord && previewRecord.usageStatus !== "blocked") return previewRecord;
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
