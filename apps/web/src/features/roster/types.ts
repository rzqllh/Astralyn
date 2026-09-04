// apps/web/src/features/roster/types.ts

export interface RosterCharacter {
  characterId: string;
  level: number;
  eidolon: number;
  isOwned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RosterState {
  roster: RosterCharacter[];
  loading: boolean;
  error: Error | null;
}
