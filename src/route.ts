/**
 * The route: every sector the player flies through, in order, and the waves
 * each one sends. The Warden waits at the end. To add a sector, add an entry.
 */

export type EnemyKind = "drone" | "dart" | "turret" | "lancer";

/**
 * How a wave's members enter (each formation spaces members apart in place,
 * time, or both):
 * - line:   side by side across the top, all at once
 * - vee:    side by side, the middle member first and the wings trailing
 * - column: one after another down a single x
 * - pincer: in pairs from the left and right edges, each pair lower and later
 */
export type Formation = "line" | "vee" | "column" | "pincer";

export interface Wave {
  /** Tick, counted from the start of the sector, when the wave begins. */
  at: number;
  kind: EnemyKind;
  count: number;
  formation: Formation;
  /** Center x for a line or vee, the x for a column; ignored by pincers. */
  x?: number;
}

export interface Sector {
  name: string;
  subtitle: string;
  /**
   * Ticks before the next sector may begin. It begins once the screen is
   * clear, or STRAGGLER_TICKS later at the latest.
   */
  length: number;
  waves: Wave[];
}

export interface EnemyStats {
  hp: number;
  score: number;
  radius: number;
  dropChance: number;
  fires: boolean;
}

export const ENEMIES: Record<EnemyKind, EnemyStats> = {
  drone: { hp: 2, score: 100, radius: 13, dropChance: 0.015, fires: true },
  dart: { hp: 1, score: 150, radius: 12, dropChance: 0.015, fires: false },
  turret: { hp: 12, score: 400, radius: 19, dropChance: 0.3, fires: true },
  lancer: { hp: 4, score: 250, radius: 15, dropChance: 0.06, fires: true },
};

export const STRAGGLER_TICKS = 240;

export const BOSS = {
  name: "The Warden",
  title: "WARNING",
  subtitle: "The Warden approaches",
};

export const SECTORS: Sector[] = [
  {
    name: "Outer Drift",
    subtitle: "Scouts ahead",
    length: 1560,
    waves: [
      { at: 60, kind: "drone", count: 4, formation: "line" },
      { at: 360, kind: "drone", count: 5, formation: "vee", x: 168 },
      { at: 660, kind: "drone", count: 5, formation: "vee", x: 312 },
      { at: 960, kind: "drone", count: 6, formation: "line" },
      { at: 1200, kind: "drone", count: 4, formation: "column", x: 120 },
      { at: 1260, kind: "drone", count: 4, formation: "column", x: 360 },
    ],
  },
  {
    name: "Shatter Belt",
    subtitle: "Divers incoming",
    length: 1800,
    waves: [
      { at: 60, kind: "drone", count: 6, formation: "vee" },
      { at: 300, kind: "dart", count: 4, formation: "line" },
      { at: 600, kind: "dart", count: 5, formation: "column", x: 144 },
      { at: 720, kind: "dart", count: 5, formation: "column", x: 336 },
      { at: 1020, kind: "drone", count: 7, formation: "line" },
      { at: 1140, kind: "dart", count: 5, formation: "vee" },
      { at: 1440, kind: "dart", count: 6, formation: "line" },
    ],
  },
  {
    name: "Gun Lanes",
    subtitle: "Turrets online",
    length: 1920,
    waves: [
      { at: 60, kind: "turret", count: 1, formation: "line" },
      { at: 240, kind: "drone", count: 6, formation: "vee" },
      { at: 540, kind: "turret", count: 2, formation: "line" },
      { at: 840, kind: "dart", count: 6, formation: "column", x: 240 },
      { at: 1080, kind: "turret", count: 2, formation: "line" },
      { at: 1140, kind: "drone", count: 6, formation: "line" },
      { at: 1500, kind: "turret", count: 3, formation: "line" },
    ],
  },
  {
    name: "Lancer Gate",
    subtitle: "Crossfire",
    length: 1920,
    waves: [
      { at: 60, kind: "lancer", count: 4, formation: "pincer" },
      { at: 360, kind: "dart", count: 6, formation: "vee" },
      { at: 600, kind: "lancer", count: 6, formation: "pincer" },
      { at: 780, kind: "turret", count: 2, formation: "line" },
      { at: 1140, kind: "lancer", count: 6, formation: "pincer" },
      { at: 1260, kind: "drone", count: 8, formation: "vee" },
      { at: 1560, kind: "dart", count: 8, formation: "line" },
    ],
  },
  {
    name: "Last Approach",
    subtitle: "Everything they have",
    length: 2040,
    waves: [
      { at: 60, kind: "turret", count: 3, formation: "line" },
      { at: 180, kind: "lancer", count: 6, formation: "pincer" },
      { at: 540, kind: "dart", count: 6, formation: "column", x: 120 },
      { at: 540, kind: "dart", count: 6, formation: "column", x: 360 },
      { at: 900, kind: "drone", count: 9, formation: "vee" },
      { at: 1020, kind: "turret", count: 2, formation: "line" },
      { at: 1320, kind: "lancer", count: 8, formation: "pincer" },
      { at: 1560, kind: "dart", count: 8, formation: "vee" },
    ],
  },
];

/** Every stop on the route, as the title screen and HUD list them. */
export const ROUTE_NAMES = [...SECTORS.map((s) => s.name), BOSS.name];

const CENTER = 240;
const TOP = -30;
const LINE_SPACING = 64;
const VEE_SPACING = 44;
const VEE_STAGGER = 10;
const COLUMN_STAGGER = 24;
const PINCER_LEFT = -30;
const PINCER_RIGHT = 510;
const PINCER_TOP = 70;
const PINCER_DROP = 50;
const PINCER_STAGGER = 30;

export interface Placement {
  /** Tick, from the start of the sector, when this member appears. */
  at: number;
  x: number;
  y: number;
  /** Which way the member first drifts: alternates 1, -1, 1, ... */
  dir: number;
}

/** Where and when member i of a wave appears. */
export function place(wave: Wave, i: number): Placement {
  const mid = (wave.count - 1) / 2;
  const dir = i % 2 === 0 ? 1 : -1;
  const pair = Math.floor(i / 2);
  switch (wave.formation) {
    case "line":
      return {
        at: wave.at,
        x: (wave.x ?? CENTER) + (i - mid) * LINE_SPACING,
        y: TOP,
        dir,
      };
    case "vee":
      return {
        at: wave.at + Math.abs(i - mid) * VEE_STAGGER,
        x: (wave.x ?? CENTER) + (i - mid) * VEE_SPACING,
        y: TOP,
        dir,
      };
    case "column":
      return {
        at: wave.at + i * COLUMN_STAGGER,
        x: wave.x ?? CENTER,
        y: TOP,
        dir,
      };
    case "pincer":
      return {
        at: wave.at + pair * PINCER_STAGGER,
        x: dir === 1 ? PINCER_LEFT : PINCER_RIGHT,
        y: PINCER_TOP + pair * PINCER_DROP,
        dir,
      };
  }
}
