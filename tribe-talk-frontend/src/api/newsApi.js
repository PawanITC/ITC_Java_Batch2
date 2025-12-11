const BASE_URL = "https://newsdata.io/api/1/latest";
const API_KEY = "pub_d120063f6a9646ecb8c7f4142c9e8c57";

export async function fetchNews({
  country = "gb",
  language = "en",
  category = "",
  size = 10,
  q = "",
} = {}) {
  const url = new URL(BASE_URL);

  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("country", country);
  url.searchParams.set("language", language);
  url.searchParams.set("size", size);
  url.searchParams.set("removeduplicate", "1");

  if (category) url.searchParams.set("category", category);
  if (q) url.searchParams.set("q", q);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch news");

  const data = await res.json();
  return data.results || [];
}