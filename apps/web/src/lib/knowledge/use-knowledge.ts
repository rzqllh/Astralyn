import * as React from "react";
import {
  knowledgeRepository,
  type CharacterFilter,
  type LightConeFilter,
  type RelicFilter,
  type SearchResultItem,
} from "./repository";
import type {
  CharacterKnowledge,
  LightConeKnowledge,
  RelicSetKnowledge,
} from "@astralyn/shared";
import type { KnowledgeSyncResult } from "./syncer";

export function useKnowledgeInit() {
  const [syncResult, setSyncResult] = React.useState<KnowledgeSyncResult | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    knowledgeRepository
      .initialize()
      .then((res) => {
        if (mounted) {
          setSyncResult(res);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setSyncResult({
            status: "unavailable",
            activeKnowledgeVersion: null,
            gameVersion: null,
            cachedAt: null,
            error: err instanceof Error ? err.message : String(err),
            isOffline: false,
          });
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { syncResult, loading };
}

export function useCharacters(filter?: CharacterFilter) {
  const [characters, setCharacters] = React.useState<CharacterKnowledge[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    knowledgeRepository
      .listCharacters(filter)
      .then((data) => {
        if (mounted) {
          setCharacters(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setCharacters([]);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [filter?.path, filter?.element, filter?.rarity, filter?.role, filter?.tag]);

  return { characters, loading };
}

export function useCharacter(id: string | null | undefined) {
  const [character, setCharacter] = React.useState<CharacterKnowledge | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) {
      setCharacter(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    knowledgeRepository
      .getCharacter(id)
      .then((char) => {
        if (mounted) {
          setCharacter(char);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setCharacter(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  return { character, loading };
}

export function useLightCones(filter?: LightConeFilter) {
  const [lightCones, setLightCones] = React.useState<LightConeKnowledge[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    knowledgeRepository
      .listLightCones(filter)
      .then((data) => {
        if (mounted) {
          setLightCones(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLightCones([]);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [filter?.path, filter?.rarity]);

  return { lightCones, loading };
}

export function useRelicSets(filter?: RelicFilter) {
  const [relicSets, setRelicSets] = React.useState<RelicSetKnowledge[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    knowledgeRepository
      .listRelicSets(filter)
      .then((data) => {
        if (mounted) {
          setRelicSets(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setRelicSets([]);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [filter?.type]);

  return { relicSets, loading };
}

export function useEntitySearch(query: string) {
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    const handler = setTimeout(() => {
      knowledgeRepository
        .searchEntities(query)
        .then((res) => {
          if (mounted) {
            setResults(res);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) {
            setResults([]);
            setLoading(false);
          }
        });
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(handler);
    };
  }, [query]);

  return { results, loading };
}
