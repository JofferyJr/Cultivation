/* Boundless legacy save migration.
   Reads historical storage keys once, copies them to Boundless keys, and leaves
   the originals untouched for rollback safety. */
(() => {
  const localPairs = [
    ["jalan-dao-save", "boundless-save"],
    ["jalan-dao-life-points", "boundless-life-points"],
    ["jalan-dao-settings", "boundless-settings"],
    ["jalan-dao-v81-bestiary", "boundless-v815-bestiary"],
    ["jalan-dao-v81-sect", "boundless-v815-sect"]
  ];
  for (const [legacy, current] of localPairs) {
    if (localStorage.getItem(current) == null) {
      const value = localStorage.getItem(legacy);
      if (value != null) localStorage.setItem(current, value);
    }
  }
  if (sessionStorage.getItem("boundless-dev-mode") == null) {
    const value = sessionStorage.getItem("jalan-dao-dev-mode");
    if (value != null) sessionStorage.setItem("boundless-dev-mode", value);
  }
})();
