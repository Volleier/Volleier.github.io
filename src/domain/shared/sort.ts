export function sortByDateDesc(entries: any[], key = "publishDate") {
  return entries.slice().sort((a, b) => {
    const da = a?.data?.[key] ? new Date(a.data[key]).getTime() : 0;
    const db = b?.data?.[key] ? new Date(b.data[key]).getTime() : 0;
    return db - da;
  });
}
