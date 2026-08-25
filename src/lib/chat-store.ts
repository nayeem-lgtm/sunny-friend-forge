import { employees } from "./employee-data";

export type ChatAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  isImage: boolean;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  mentions: string[];
  attachments: ChatAttachment[];
  createdAt: string;
  reactions: Record<string, string[]>;
  replyToId?: string;
  pinned?: boolean;
};

const KEY = "omniwork.omnichat.v1";

export const currentUser = {
  id: "me",
  name: "Nayeem Ahmad",
  role: "Admin",
};

export const chatPeople = [
  { id: currentUser.id, name: currentUser.name, department: "Management" },
  ...employees.map((e) => ({
    id: e.id,
    name: `${e.firstName} ${e.lastName}`,
    department: e.department,
  })),
];

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function parseMentions(text: string) {
  return chatPeople.filter((p) => text.toLowerCase().includes(`@${p.name.toLowerCase()}`)).map((p) => p.name);
}

function ago(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const seedMessages: ChatMessage[] = [
  {
    id: "msg-1",
    authorId: chatPeople[1]?.id ?? "e1",
    authorName: chatPeople[1]?.name ?? "Team",
    text: "Good morning everyone! Reminder that EOD reports are due by 7:00 PM today.",
    mentions: [],
    attachments: [],
    createdAt: ago(240),
    reactions: { "👍": ["e2", "e3"] },
    pinned: true,
  },
  {
    id: "msg-2",
    authorId: chatPeople[2]?.id ?? "e2",
    authorName: chatPeople[2]?.name ?? "Team",
    text: "The new campaign creatives are uploaded to the shared drive. @Nayeem Ahmad please review when free.",
    mentions: ["Nayeem Ahmad"],
    attachments: [],
    createdAt: ago(120),
    reactions: {},
  },
  {
    id: "msg-3",
    authorId: currentUser.id,
    authorName: currentUser.name,
    text: "Thanks — reviewing now. All-hands is tomorrow at 11:00 AM, link is in the Meetings tab.",
    mentions: [],
    attachments: [],
    createdAt: ago(45),
    reactions: { "🎉": ["e4"] },
  },
];

export function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return seedMessages;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedMessages;
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return seedMessages;
  }
}

export function saveMessages(list: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-200)));
  } catch {
    /* quota — ignore */
  }
}

export function readFileAsAttachment(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: String(reader.result),
        isImage: file.type.startsWith("image/"),
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
