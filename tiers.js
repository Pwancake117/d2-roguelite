/* D2 Roguelite reward tiers (PvE). Tiers are by reward type:
   S = supers, swap artifact · A = fragments · B = aspects, extra lives (+1 or +2), +2 artifact points · C = grenades, jumps, melees, class abilities.
   A pick offers at most 2 fragments (and no more than your open fragment slots); it can offer several aspects or supers.
   Edit freely: move a type key between tiers, or change the odds below. */
window.D2R_TIERS = {
  S: ["super", "artswap"],
  A: ["fragment"],
  B: ["aspect", "life", "artpts"],
  C: ["grenade", "jump", "melee", "classAbility"]
};

/* Odds of each tier per offered choice, by reward level.
   Reward level = event power (tier + difficulty) + 1 if flawless.
   Solo Ops on Normal = 2, Fireteam Ops on Expert = 5, Pinnacle on Master = 7, Grandmaster = 8+. */
window.D2R_REWARD_ODDS = [
  {upTo: 3,        S: 5,  A: 25, B: 25, C: 45},
  {upTo: 5,        S: 10, A: 30, B: 30, C: 30},
  {upTo: 7,        S: 20, A: 30, B: 30, C: 20},
  {upTo: Infinity, S: 30, A: 30, B: 30, C: 10}
];

/* Difficulty floor for S tier: chance that a pick includes at least one S reward, by difficulty
   (0 Normal, 1 Advanced/Hero, 2 Expert/Legend, 3 Master, 4 Grandmaster/Ultimate). */
window.D2R_S_FLOOR = {3: 0.5, 4: 0.95};
