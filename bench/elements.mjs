// Matches the elements two engines failed for one criterion on one page.
// An element is the same when its path in the page is (run.mjs), or else
// when its HTML starts the same: a script an engine injects can shift the
// child indexes of what follows it.

const start = (f) => (f.html || '').replace(/\s+/g, ' ').slice(0, 150);

export function matchElements(a, b) {
  const one = (list) => {
    const seen = new Set();
    return list.filter((f) => (f.path || f.html) && !seen.has(f.path ?? start(f)) && seen.add(f.path ?? start(f)));
  };
  const left = one(a);
  const right = one(b);
  const paths = new Set(right.map((f) => f.path).filter(Boolean));
  const htmls = new Set(right.map(start).filter(Boolean));
  const shared = left.filter((f) => (f.path && paths.has(f.path)) || (start(f) && htmls.has(start(f))));
  const leftPaths = new Set(left.map((f) => f.path).filter(Boolean));
  const leftHtmls = new Set(left.map(start).filter(Boolean));
  return {
    shared,
    aOnly: left.filter((f) => !shared.includes(f)),
    bOnly: right.filter((f) => !((f.path && leftPaths.has(f.path)) || (start(f) && leftHtmls.has(start(f)))))
  };
}
