import apiClient from './apiClient';
import { Group, GroupCategory } from '../types';

export interface CreateGroupPayload {
  name: string;
  category: GroupCategory;
  description?: string;
  emoji?: string;
}

// ─── Raw API shape ────────────────────────────────────────────────────────────
// GET /groups  → _count.members (number)
// POST /groups → members: [{ groupId, userId, joinedAt }]  (array)

interface GroupRaw {
  id: string;
  name: string;
  emoji?: string | null;
  category: string;
  description?: string | null;
  createdAt?: string;
  // list endpoint
  _count?: { members?: number };
  // create endpoint
  members?: Array<unknown> | number;
}

function toGroup(raw: GroupRaw): Group {
  let memberCount = 0;
  if (typeof raw._count?.members === 'number') {
    memberCount = raw._count.members;
  } else if (Array.isArray(raw.members)) {
    memberCount = raw.members.length;
  } else if (typeof raw.members === 'number') {
    memberCount = raw.members;
  }
  return {
    id:          raw.id,
    name:        raw.name,
    emoji:       raw.emoji ?? null,
    category:    (raw.category as Group['category']) ?? 'Other',
    members:     memberCount,
    description: raw.description ?? null,
    createdAt:   raw.createdAt,
  };
}

type ListEnvelope = GroupRaw[] | { data: GroupRaw[] } | { groups: GroupRaw[] };
type ItemEnvelope = GroupRaw | { data: GroupRaw } | { group: GroupRaw };

function unwrapList(raw: ListEnvelope): GroupRaw[] {
  if (Array.isArray(raw)) return raw;
  if ('data'   in raw && Array.isArray(raw.data))   return raw.data;
  if ('groups' in raw && Array.isArray(raw.groups)) return raw.groups;
  return [];
}

function unwrapItem(raw: ItemEnvelope): GroupRaw {
  if ('data'  in raw && raw.data  && typeof raw.data  === 'object') return raw.data  as GroupRaw;
  if ('group' in raw && raw.group && typeof raw.group === 'object') return raw.group as GroupRaw;
  return raw as GroupRaw;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const groupsService = {
  /** GET /groups */
  getGroups: async (): Promise<Group[]> => {
    const res = await apiClient.get<ListEnvelope>('/groups');
    return unwrapList(res.data).map(toGroup);
  },

  /** GET /groups/:id */
  getGroup: async (groupId: string): Promise<Group> => {
    const res = await apiClient.get<ItemEnvelope>(`/groups/${groupId}`);
    return toGroup(unwrapItem(res.data));
  },

  /** POST /groups — body: { name, category, description?, emoji? } */
  createGroup: async (payload: CreateGroupPayload): Promise<Group> => {
    const res = await apiClient.post<ItemEnvelope>('/groups', payload);
    return toGroup(unwrapItem(res.data));
  },

  /** POST /groups/:id/join — returns a membership record { groupId, userId, joinedAt } */
  joinGroup: async (groupId: string): Promise<string> => {
    await apiClient.post(`/groups/${groupId}/join`);
    return groupId;
  },

  /** POST /groups/:id/leave — returns { success: true } */
  leaveGroup: async (groupId: string): Promise<string> => {
    await apiClient.post(`/groups/${groupId}/leave`);
    return groupId;
  },
};
