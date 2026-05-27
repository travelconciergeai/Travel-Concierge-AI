export const clonePlanState = (value) => JSON.parse(JSON.stringify(value));

export const uniqueInsights = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.kind}:${item.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
