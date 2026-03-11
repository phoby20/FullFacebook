"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  birthDay: string;
  photoPath?: string;
  isActive: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/management");
      const data: User[] = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/management", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isActive: !current,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !current } : u)),
      );
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 600,
          marginBottom: "10px",
        }}
      >
        先生管理
      </h1>
      <p className="mb-6">
        スイッチをOFFにすると先生のアカウントが非活性化され、すべてのリストにも表示されず、ログインできなくなります
      </p>

      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #e5e5e5",
        }}
      >
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #eee",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={user.photoPath || "/default_user.png"}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />

              <div>
                <div style={{ fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {new Date(user.birthDay).toLocaleDateString()}
                </div>
              </div>
            </div>

            <label
              style={{
                position: "relative",
                display: "inline-block",
                width: 50,
                height: 26,
              }}
            >
              <input
                type="checkbox"
                checked={user.isActive}
                onChange={() => toggleActive(user.id, user.isActive)}
                style={{ display: "none" }}
              />

              <span
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  inset: 0,
                  background: user.isActive ? "#34C759" : "#ccc",
                  borderRadius: 26,
                  transition: "0.2s",
                }}
              />

              <span
                style={{
                  position: "absolute",
                  height: 22,
                  width: 22,
                  left: user.isActive ? 26 : 2,
                  top: 2,
                  background: "white",
                  borderRadius: "50%",
                  transition: "0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
