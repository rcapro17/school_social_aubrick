"use client";

import { useMemo, useState } from "react";
import styles from "./ReactionBar.module.css";
import { api } from "@/lib/apiClient";

/**
 * ICON FILES (public/icons):
 * - /icons/darwin_icon.png
 * - /icons/tesla_icon.png
 * - /icons/mandela_icon.png
 * - /icons/fallback_icon.png  (fallback)
 *
 * This component supports BOTH old backend keys
 *   (einstein, shakespeare, davinci, mandela)
 * AND the new UI names (darwin, tesla, mandela).
 *
 * It normalizes what the server returns and chooses
 * the correct key to POST back, based on what the
 * server supports.
 */

// UI reactions we want to show (order matters)
const UI_REACTIONS = [
  { uiKey: "darwin", label: "Darwin", src: "/icons/darwin_icon.png" },
  { uiKey: "tesla", label: "Tesla", src: "/icons/tesla_icon.png" },
  { uiKey: "mandela", label: "Mandela", src: "/icons/mandela_icon.png" },
];

// Fallback icon if an image fails
const FALLBACK_SRC = "/icons/fallback_icon.png";

// Alias map: which backend keys map to each UI reaction
// (so we can work with old or new server enums transparently)
const ALIASES = {
  darwin: ["darwin", "einstein", "shakespeare"], // both are "thinker/scientist" vibes
  tesla: ["tesla", "davinci"], // inventor/renaissance bucket
  mandela: ["mandela"], // same
};

// Build reverse lookup: backend key -> uiKey
const BACKEND_TO_UI = Object.entries(ALIASES).reduce((acc, [uiKey, arr]) => {
  for (const k of arr) acc[k] = uiKey;
  return acc;
}, {});

/** Given a backend key, return its UI key */
function uiKeyFromBackend(backendKey) {
  return BACKEND_TO_UI[backendKey] || null;
}

/**
 * Choose which backend key to send for a given UI key,
 * based on the keys your server seems to support on this post.
 *
 * Strategy:
 * 1) If the UI key itself is present in reaction_counts, use it.
 * 2) Else use the first alias that appears in reaction_counts.
 * 3) Else default to the first alias in ALIASES[uiKey].
 */
function resolveBackendKey(uiKey, post) {
  const supported = new Set(Object.keys(post?.reaction_counts || {}));
  const aliases = ALIASES[uiKey] || [uiKey];

  // prefer exact uiKey if supported
  if (supported.has(uiKey)) return uiKey;

  // then any alias present from server counts
  for (const k of aliases) {
    if (supported.has(k)) return k;
  }

  // fallback to first alias; server may still accept it even if 0 count
  return aliases[0];
}

/** Merge server counts into UI buckets using aliases */
function normalizeCounts(post) {
  const out = { darwin: 0, tesla: 0, mandela: 0 };
  const rc = post?.reaction_counts || {};

  // Accumulate by alias
  for (const [backendKey, n] of Object.entries(rc)) {
    if (backendKey === "total") continue;
    const uiKey = uiKeyFromBackend(backendKey);
    if (uiKey && out[uiKey] != null) out[uiKey] += n || 0;
  }

  // Fallback: if reaction_counts absent, compute from raw reactions
  if (
    (!post?.reaction_counts ||
      Object.keys(post.reaction_counts).length === 0) &&
    Array.isArray(post?.reactions)
  ) {
    for (const r of post.reactions) {
      const uiKey = uiKeyFromBackend(r.type);
      if (uiKey && out[uiKey] != null) out[uiKey] += 1;
    }
  }
  return out;
}

/** Read my reaction from server and return the UI key */
function getMyReactionUI(post) {
  if (post?.my_reaction) {
    return uiKeyFromBackend(post.my_reaction);
  }
  // fallback inference if you also send me_id + reactions
  const meId = post?.me_id;
  if (!meId || !Array.isArray(post?.reactions)) return null;
  const mine = post.reactions.find((r) => r.user === meId);
  return mine ? uiKeyFromBackend(mine.type) : null;
}

export default function ReactionBar({ post, onChanged }) {
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => normalizeCounts(post), [post]);
  const myReaction = useMemo(() => getMyReactionUI(post), [post]);

  async function setReaction(uiKey) {
    if (busy) return;
    setBusy(true);
    try {
      // Toggle behavior: tap same icon removes it
      if (myReaction === uiKey) {
        const data = await api(`/posts/${post.id}/unreact/`, {
          method: "POST",
        });
        onChanged?.(data);
      } else {
        const backendKey = resolveBackendKey(uiKey, post);
        const data = await api(`/posts/${post.id}/react/`, {
          method: "POST",
          body: JSON.stringify({ type: backendKey }),
        });
        onChanged?.(data);
      }
    } finally {
      setBusy(false);
    }
  }

  // “Social-like” short summary: show only icons that have count
  const hasAny =
    (counts.darwin || 0) + (counts.tesla || 0) + (counts.mandela || 0) > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.iconsRow} role="group" aria-label="Reactions">
        {UI_REACTIONS.map(({ uiKey, label, src }) => (
          <button
            key={uiKey}
            className={`${styles.iconBtn} ${
              myReaction === uiKey ? styles.active : ""
            }`}
            onClick={() => setReaction(uiKey)}
            aria-pressed={myReaction === uiKey}
            aria-label={label}
            title={label}
            disabled={busy}>
            <img
              src={src}
              alt={label}
              className={styles.iconImg}
              onError={(e) => (e.currentTarget.src = FALLBACK_SRC)}
            />
            {counts[uiKey] ? (
              <span className={styles.count}>{counts[uiKey]}</span>
            ) : null}
          </button>
        ))}

        {/* Clear (only shown if the user reacted) */}
        {myReaction && (
          <button
            className={styles.clearBtn}
            onClick={() => setReaction(myReaction)}
            disabled={busy}
            title="Remove reaction"
            aria-label="Remove my reaction">
            Remover
          </button>
        )}
      </div>

      {/* Compact summary like big socials: only shows when there are reactions */}
      <div className={styles.summary} aria-live="polite">
        {hasAny ? (
          <>
            {counts.darwin ? (
              <img
                src="/icons/darwin_icon.png"
                alt="Darwin"
                className={styles.summaryIcon}
                onError={(e) => (e.currentTarget.src = FALLBACK_SRC)}
              />
            ) : null}
            {counts.tesla ? (
              <img
                src="/icons/tesla_icon.png"
                alt="Tesla"
                className={styles.summaryIcon}
                onError={(e) => (e.currentTarget.src = FALLBACK_SRC)}
              />
            ) : null}
            {counts.mandela ? (
              <img
                src="/icons/mandela_icon.png"
                alt="Mandela"
                className={styles.summaryIcon}
                onError={(e) => (e.currentTarget.src = FALLBACK_SRC)}
              />
            ) : null}
            <span className={styles.summaryText}>
              {counts.darwin + counts.tesla + counts.mandela}
            </span>
          </>
        ) : (
          <span className={styles.summaryPlaceholder}>
            Seja o primeiro a reagir
          </span>
        )}
      </div>
    </div>
  );
}
