export async function typedFetch<T>(url: string, init: RequestInit) {
  const result = await fetch(url, init);
  const data = (await result.json()) as T;

  return data;
}
