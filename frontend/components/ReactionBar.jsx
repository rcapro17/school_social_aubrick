"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/apiClient";

export default function ReactionBar({ post, onChanged }) {
  const [busy, setBusy] = useState(false);

  // If your serializer already provides counts (e.g., post.reaction_counts),
  // prefer those. Otherwise, compute from post.reactions.
  const counts = useMemo(() => {
    if (post.reaction_counts) return post.reaction_counts;
    const c = { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, angry: 0 };
    (post.reactions || []).forEach((r) => {
      c[r.type] = (c[r.type] || 0) + 1;
    });
    return c;
  }, [post]);

  // If your serializer provides my_reaction, use it; else infer from reactions.
  const myReaction = useMemo(() => {
    if (post.my_reaction) return post.my_reaction;
    const meId = post.me_id; // only if you added it; otherwise skip.
    if (!meId) return null;
    const mine = (post.reactions || []).find((r) => r.user === meId);
    return mine?.type || null;
  }, [post]);

  async function setReaction(type) {
    if (busy) return;
    setBusy(true);
    try {
      if (myReaction === type) {
        await api(`/posts/${post.id}/unreact/`, { method: "POST" });
      } else {
        await api(`/posts/${post.id}/react/`, {
          method: "POST",
          body: JSON.stringify({ type }),
        });
      }
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["👍 Like", "like"],
          ["❤️ Love", "love"],
          ["😂 Laugh", "laugh"],
          ["😮 Wow", "wow"],
          ["😢 Sad", "sad"],
          ["😡 Angry", "angry"],
        ].map(([label, key]) => (
          <button
            key={key}
            className="react"
            onClick={() => setReaction(key)}
            aria-pressed={myReaction === key}
            title={label}>
            {label} {counts[key] ? `(${counts[key]})` : ""}
          </button>
        ))}

        {myReaction && (
          <button className="react" onClick={() => setReaction(myReaction)}>
            ❌ Remove reaction
          </button>
        )}
      </div>
    </div>
  );
}
