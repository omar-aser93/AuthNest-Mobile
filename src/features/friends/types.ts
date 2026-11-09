// ─── Friend ──────────────────────────────────────────────────────────────────
// Returned by:
//   - GET /social/friends           (getMyFriends — attaches friendshipId)
//   - GET /social/friends/blocked   (getBlockedUsers — attaches friendshipId)
export type Friend = {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  friendshipId: string;
};

export type FriendsResponse = {
  friends: Friend[];
  nextCursor: string | null;
};


// ─── Friendship status ───────────────────────────────────────────────────────
export type FriendshipStatusValue = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';

// Matches GET /social/friends/status/:userId
//   - No relationship:  { status: null }
//   - Has relationship: { status, friendshipId, direction }
export type FriendshipStatusResponse = {
  status: FriendshipStatusValue | null;
  friendshipId?: string;
  direction?: 'sent' | 'received';
};


// ─── Friend requests ─────────────────────────────────────────────────────────
// Backend returns nested users as { id, name, image, bio } — no friendshipId.
// The outer FriendRequest.id IS the friendshipId (used for accept / decline / cancel).
export type FriendRequestUser = {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
};

export type FriendRequest = {
  id: string;                    // ← friendshipId
  requester: FriendRequestUser;
  receiver: FriendRequestUser;
  createdAt?: string;
};

export type RequestsResponse = {
  requests: FriendRequest[];
  nextCursor: string | null;
};


// ─── Suggestions ─────────────────────────────────────────────────────────────
// Matches GET /social/friends/suggestions → { suggestions: [...] }
// Each suggestion includes mutualFriendsCount, computed server-side.
export type Suggestion = {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  mutualFriendsCount: number;
};

export type SuggestionsResponse = {
  suggestions: Suggestion[];
};


// ─── Blocked users ───────────────────────────────────────────────────────────
// Same shape as Friend — friendshipId lets the client unblock by userId
// (backend `unblockUser` looks up by the pair, not by friendshipId).
export type BlockedUsersResponse = {
  users: Friend[];
  nextCursor: string | null;
};