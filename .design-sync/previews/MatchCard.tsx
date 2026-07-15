import * as React from "react";
import { MatchCard } from "frontend";

const sarah = {
  id: 2,
  displayName: "Sarah Jenkins",
  lastActive: new Date().toISOString(),
  dob: "2000-03-14",
  city: "Hồ Chí Minh",
  languages: [
    { id: 1, role: "native", language: { name: "English" } },
    { id: 2, role: "learning", level: "2", language: { name: "Tiếng Việt" } },
  ],
};

const david = {
  id: 3,
  displayName: "David Smith",
  lastActive: "2026-01-01T00:00:00.000Z",
  dob: "1996-07-01",
  city: "Hà Nội",
  languages: [
    { id: 3, role: "fluent", language: { name: "English" } },
    { id: 4, role: "learning", level: "3", language: { name: "Tiếng Việt" } },
  ],
};

export function Default() {
  return (
    <div style={{ width: 360 }}>
      <MatchCard
        user={sarah}
        whyMatched={{ sharedTopics: ["Du lịch", "Công nghệ"] }}
        onLike={() => {}}
      />
    </div>
  );
}

export function DaThich() {
  return (
    <div style={{ width: 360 }}>
      <MatchCard
        user={david}
        whyMatched={{ sharedTopics: ["Đọc sách"] }}
        liked
        onLike={() => {}}
      />
    </div>
  );
}
