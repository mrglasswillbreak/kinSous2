const DB = "kinsous-drafts-v1";
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function draftOperation<T>(
  key: string,
  operation: "read" | "write" | "delete",
  value?: T,
): Promise<T | undefined> {
  try {
    const db = await database();
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(
        "drafts",
        operation === "read" ? "readonly" : "readwrite",
      );
      const store = tx.objectStore("drafts");
      const req =
        operation === "read"
          ? store.get(key)
          : operation === "delete"
            ? store.delete(key)
            : store.put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve(operation === "read" ? req.result : undefined);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return undefined;
  }
}
export async function clearDrafts() {
  try {
    const db = await database();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {}
}
