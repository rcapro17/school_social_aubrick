"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

function CommentItem({ c, me, onReply, onDelete }) {
  const [showReply, setShowReply] = useState(false);
  const [text, setText] = useState("");

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {c.author?.avatar && (
          <img
            src={c.author.avatar}
            alt={c.author.username}
            className="avatar"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <div>
          <div>
            <strong>{c.author?.username}</strong>{" "}
            <small style={{ color: "#666" }}>
              {new Date(c.created_at).toLocaleString()}
            </small>
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>{c.content}</div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className="btn secondary"
              onClick={() => setShowReply((v) => !v)}>
              {showReply ? "Cancel" : "Reply"}
            </button>
            {(me?.role === "teacher" || me?.id === c.author?.id) && (
              <button className="btn secondary" onClick={() => onDelete(c.id)}>
                Delete
              </button>
            )}
          </div>

          {showReply && (
            <div style={{ marginTop: 6 }}>
              <textarea
                rows={2}
                className="input"
                placeholder="Write a reply..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <button
                  className="btn"
                  onClick={() => {
                    if (!text.trim()) return;
                    onReply(c.id, text.trim());
                    setText("");
                    setShowReply(false);
                  }}>
                  Reply
                </button>
              </div>
            </div>
          )}

          {/* children */}
          {c.replies?.length > 0 && (
            <div style={{ marginLeft: 36 }}>
              {c.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  c={r}
                  me={me}
                  onReply={onReply}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsThread({ postId, me }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api(`/comments/?post=${postId}`);
      setComments(data.results || data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [postId]);

  async function addComment(parent, content) {
    await api(`/comments/`, {
      method: "POST",
      body: JSON.stringify({ post: postId, parent, content }),
    });
    await load();
  }

  async function deleteComment(id) {
    await api(`/comments/${id}/`, { method: "DELETE" });
    await load();
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div>
        <textarea
          rows={2}
          className="input"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div style={{ marginTop: 6 }}>
          <button
            className="btn"
            onClick={() => {
              if (!text.trim()) return;
              addComment(null, text.trim());
              setText("");
            }}>
            Comment
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {loading ? (
          <div style={{ color: "#666" }}>Loading comments…</div>
        ) : comments.length === 0 ? (
          <div style={{ color: "#666" }}>No comments yet.</div>
        ) : (
          comments
            .filter((c) => !c.parent) // render only roots; children come via replies
            .map((c) => (
              <CommentItem
                key={c.id}
                c={c}
                me={me}
                onReply={addComment}
                onDelete={deleteComment}
              />
            ))
        )}
      </div>
    </div>
  );
}
