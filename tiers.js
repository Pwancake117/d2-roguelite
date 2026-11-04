/* D2 Roguelite reward tiers (PvE). Tiers are by reward type:
   S = supers, unlock subclass · A = aspects, new artifact, +2 artifact points · B = fragments, +1 life · C = grenades, jumps, melees, class abilities.
   A pick offers at most one S reward and one A reward; B and C rewards can repeat.
   Edit freely: move a type key between tiers, or change the odds below. */
window.D2R_TIERS = {
  S: ["super", "subclass"],
  A: ["aspect", "artswap", "artpts"],
  B: ["fragment", "life"],
  C: ["grenade", "jump", "melee", "classAbility"]
};

/* Tiers that can appear at most once in a pick */
window.D2R_ONE_PER_PICK = ["S", "A"];

/* Odds of each tier per offered choice, by reward level.
   Reward level = event power (tier + difficulty) + 1 if flawless.
   Solo Ops on Normal = 2, Fireteam Ops on Expert = 5, Pinnacle on Master = 7, Grandmaster = 8+. */
window.D2R_REWARD_ODDS = [
  {upTo: 3,        S: 3,  A: 25, B: 27, C: 45},
  {upTo: 5,        S: 6,  A: 30, B: 32, C: 32},
  {upTo: 7,        S: 8,  A: 32, B: 34, C: 26},
  {upTo: Infinity, S: 10, A: 35, B: 38, C: 17}
];

/* Difficulty floor for S tier: chance that the first reward pick of an event includes an S reward, by difficulty
   (0 Normal, 1 Advanced/Hero, 2 Expert/Legend, 3 Master, 4 Grandmaster/Ultimate). */
window.D2R_S_FLOOR = {3: 0.5, 4: 0.95};
