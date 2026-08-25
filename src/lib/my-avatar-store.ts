import { useCallback, useEffect, useState } from "react";

const KEY = "omniwork.my.avatars.v1";

type AvatarMap = Record<string, string>;

function read(): AvatarMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AvatarMap) : {};
  } catch {
    return {};
  }
}

function write(map: AvatarMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

const EVENT = "omniwork:avatar-change";

export function setAvatar(employeeId: string, dataUrl: string | null) {
  const map = read();
  if (dataUrl) map[employeeId] = dataUrl;
  else delete map[employeeId];
  write(map);
  window.dispatchEvent(new Event(EVENT));
}

export function useMyAvatar(employeeId: string) {
  const [url, setUrl] = useState<string | null>(null);

  const sync = useCallback(() => {
    setUrl(read()[employeeId] ?? null);
  }, [employeeId]);

  useEffect(() => {
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return {
    avatarUrl: url,
    save: (dataUrl: string) => setAvatar(employeeId, dataUrl),
    remove: () => setAvatar(employeeId, null),
  };
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
  });
}
