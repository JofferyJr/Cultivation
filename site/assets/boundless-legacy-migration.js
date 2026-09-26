/* Boundless legacy save migration.
   Migrates historical item IDs to the v8.1.5 category-ID system before the app reads saves. */
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

  const ITEM_ID_MAP = {"pil-qi-awal":"PIL-001","pil-penyembuhan-rendah":"PIL-002","herba-roh":"HERB-001","bahan-dao":"MAT-DAO-001","pedang-latihan":"WPN-001","jubah-pengembara":"ARM-001","beg-penyimpanan":"STORAGE-001","jimat-perisai":"TALISMAN-001","cincin-ruang":"ACCESSORY-001","pedang-langit":"WPN-002","jubah-abadi":"ARM-002","kompas-ilahi":"COMPASS-001","jade-slip":"MANUAL-SLIP-001","tablet-kehidupan":"QUEST-TABLET-001","labu-roh":"SPIRIT-001","bendera-formasi":"FORMATION-001","kompas-roh":"COMPASS-002","pedang-terbang":"WPN-003","kipas-angin-roh":"ART-001","loceng-jiwa":"ART-002","bakal-pedang":"WPN-004","beast-core":"BEASTCORE-001","manual-asas-sekte":"MANUAL-001","manual-pedang-langit":"MANUAL-002","manual-formasi":"MANUAL-003","manual-nadi-naga-langit":"MANUAL-004","manual-nirvana-phoenix-purba":"MANUAL-005","manual-manual-nadi-naga-langit":"MANUAL-004","manual-manual-nirvana-phoenix-purba":"MANUAL-005","token-sekte-keluarga":"SECT-TOKEN-001","jubah-murid-teras":"ARM-003","pakaian-latihan-teras":"ARM-004","token-identiti-pewaris":"HEIR-TOKEN-001","cincin-simpanan-sekte":"SECT-STORAGE-001","kunci-formasi-pewaris":"HEIR-KEY-001","lambang-keluarga-ketua":"SECT-EMBLEM-001","bestiari-35-spesies":"BESTIARY-001","pedang-awan-putih":"WPN-101","pedang-hujan-giok":"WPN-102","pedang-bayu":"WPN-103","pedang-tanpa-nama":"WPN-104","pedang-bintang-patah":"WPN-105","pedang-langit-purba":"WPN-106","dendrobium-officinale":"HERB-002","tianshan-snow-lotus":"HERB-003","three-tael-ginseng":"HERB-004","polygonum-120":"HERB-005","poria-60":"HERB-006","wild-ganoderma":"HERB-007","sea-pearl":"HERB-008","cordyceps-sinensis":"HERB-009","cistanche-deserticola":"HERB-010","deep-black-iron":"ORE-001","millennium-cold-iron":"ORE-002","fallen-star-meteor-iron":"ORE-003","purple-thunder-ore":"ORE-004","earth-vein-gold-sand":"ORE-005","celestial-jade-iron":"ORE-006","moon-spirit-silver":"INGOT-001","solar-crow-red-gold":"INGOT-002","ancient-dragon-bronze":"INGOT-003","azure-cloud-steel":"INGOT-004","tombak-langit":"WPN-201","mountain-rending-axe":"WPN-202","tempest-dragon-whip":"WPN-203","star-magistrate-brush":"WPN-204","taiyi-dust-whisk":"WPN-205","twin-moon-wheels":"WPN-206","vermilion-phoenix-bow":"WPN-207","golden-meridian-needles":"WPN-208","moonwater-mirror":"ART-101","nine-cloud-pagoda":"ART-102","earth-dragon-cauldron":"ART-103","black-lotus-parasol":"ART-104","mata-abyss-kuno":"PORTAL-001","prisma-kristal-palung":"PORTAL-002","tanduk-ribut-taufan":"PORTAL-003","genta-air-terjun-langit":"PORTAL-004","kelopak-teratai-samudra":"PORTAL-005","mutiara-inti-roh":"PORTAL-006","serpihan-ais-abadi":"PORTAL-007","kunci-portal-laut-utuh":"PORTAL-008"};
  const mapId = (value) => {
    if (typeof value !== "string") return value;
    if (Object.prototype.hasOwnProperty.call(ITEM_ID_MAP, value)) return ITEM_ID_MAP[value];
    const forge = value.match(/^artifak-tempa-(\\d+)$/);
    return forge ? "FORGE-ARTIFACT-" + forge[1] : value;
  };
  const migrate = (value) => {
    if (Array.isArray(value)) return value.map(migrate);
    if (value && typeof value === "object") {
      const out = {};
      for (const [key, child] of Object.entries(value)) out[mapId(key)] = migrate(child);
      return out;
    }
    return mapId(value);
  };
  const save = localStorage.getItem("boundless-save");
  if (save != null) {
    try {
      const parsed = JSON.parse(save);
      const migrated = migrate(parsed);
      localStorage.setItem("boundless-save", JSON.stringify(migrated));
    } catch (_) {
      /* Keep non-JSON saves untouched; the app can handle its own format. */
    }
  }
})();