/* D2 Roguelite reward tiers (PvE). Tiers are by reward type:
   S = supers · A = fragments (and +1 fragment slot) · B = aspects, extra lives (+1 or +2) · C = grenades, jumps, melees, class abilities.
   A pick never offers more than one fragment (or fragment slot); it can offer several aspects or supers.
   Edit freely: move a type key between tiers, or change the odds below. */
window.D2R_TIERS = {
  S: ["super"],
  A: ["fragment", "fragslot"],
  B: ["aspect", "life"],
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
