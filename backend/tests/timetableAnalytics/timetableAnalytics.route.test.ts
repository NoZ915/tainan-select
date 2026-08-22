import assert from "node:assert/strict";
import test from "node:test";
import router from "../../routes/timetableAnalytics";

test("匿名課表 analytics 僅提供 PUT 與 DELETE snapshot routes", () => {
  const routes = (router as unknown as {
    stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }>;
  }).stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route!.path,
      methods: Object.keys(layer.route!.methods).sort(),
    }));

  assert.deepEqual(routes, [
    { path: "/guest-snapshot", methods: ["put"] },
    { path: "/guest-snapshot", methods: ["delete"] },
  ]);
});
