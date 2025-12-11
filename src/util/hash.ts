export function hash(key: string, tableSize: number) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // Ensure hash remains a 32-bit integer
  }
  return Math.abs(hash % tableSize); // Ensure positive and within table bounds
}