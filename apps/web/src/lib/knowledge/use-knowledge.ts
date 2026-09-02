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

function normalizeError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}

export function useKnowledgeInit() {
  const [syncResult, setSyncResult] = React.useState<KnowledgeSyncResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    knowledgeRepository
      .initialize()
      .then((res) => {
        if (mounted) {
          setSyncResult(res);
          setError(res.error ? new Error(res.error) : null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          const normErr = normalizeError(err);
          setSyncResult({
            status: "unavailable",
            activeKnowledgeVersion: null,
            gameVersion: null,
            cachedAt: null,
            error: normErr.message,
            isOffline: false,
          });
          setError(normErr);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { syncResult, loading, error };
}

export function useCharacters(filter?: CharacterFilter) {
  const [characters, setCharacters] = React.useState<CharacterKnowledge[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    knowledgeRepository
      .listCharacters(filter)
      .then((data) => {
        if (mounted) {
          setCharacters(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setCharacters([]);
          setError(normalizeError(err));
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [filter?.path, filter?.element, filter?.rarity, filter?.role, filter?.tag]);

  return { characters, loading, error };
}

export function useCharacter(id: string | null | undefined) {
  const [character, setCharacter] = React.useState<CharacterKnowledge | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!id) {
      setCharacter(null);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    knowledgeRepository
      .getCharacter(id)
      .then((char) => {
        if (mounted) {
          setCharacter(char);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setCharacter(null);
          setError(normalizeError(err));
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  return { character, loading, error };
}

export function useLightCones(filter?: LightConeFilter) {
  const [lightCones, setLightCones] = React.useState<LightConeKnowledge[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    knowledgeRepository
      .listLightCones(filter)
      .then((data) => {
        if (mounted) {
          setLightCones(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setLightCones([]);
          setError(normalizeError(err));
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [filter?.path, filter?.rarity]);

  return { lightCones, loading, error };
}

export function useRelicSets(filter?: RelicFilter) {
  const [relicSets, setRelicSets] = React.useState<RelicSetKnowledge[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    knowledgeRepository
      .listRelicSets(filter)
      .then((data) => {
        if (mounted) {
          setRelicSets(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setRelicSets([]);
          setError(normalizeError(err));
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [filter?.type]);

  return { relicSets, loading, error };
}

export function useEntitySearch(query: string) {
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    const handler = setTimeout(() => {
      knowledgeRepository
        .searchEntities(query)
        .then((res) => {
          if (mounted) {
            setResults(res);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (mounted) {
            setResults([]);
            setError(normalizeError(err));
            setLoading(false);
          }
        });
    }, 150);

    return () => {
      mounted = false;
      clearTimeout(handler);
    };
  }, [query]);

  return { results, loading, error };
}
