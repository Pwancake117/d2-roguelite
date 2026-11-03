/* D2 Roguelite reward tier list (PvE). Edit freely: move a name between lists to change its tier.
   Anything not listed is tier B. Names must match the in-game name exactly.
   Harder events (and flawless clears) offer higher tiers more often; see REWARD_ODDS below. */
window.D2R_TIERS = {
  S: [
    // supers
    "Well of Radiance", "Song of Flame", "Twilight Arsenal", "Needlestorm", "Golden Gun: Marksman",
    // grenades
    "Healing", "Vortex", "Grapple", "Threadling",
    // melees
    "Combination Blow", "Thunderclap", "Knife Trick", "Shield Throw",
    // aspects
    "Consecration", "Knockout", "Feed the Void", "Weaver's Call", "Bleak Watcher", "Threaded Specter",
    "Banner of War", "Gunpowder Gamble", "Ascension", "Hellion", "Child of the Old Gods", "Diamond Lance",
    "Stylish Executioner",
    // fragments
    "Spark of Ions", "Spark of Shock", "Ember of Torches", "Ember of Empyrean", "Ember of Ashes",
    "Echo of Instability", "Echo of Undermining", "Echo of Starvation", "Whisper of Shards", "Whisper of Chains",
    "Thread of Generation", "Thread of Warding", "Facet of Dawn", "Facet of Purpose", "Facet of Courage",
    "Facet of Protection", "Facet of Ruin"
  ],
  A: [
    "Thundercrash", "Nova Bomb: Cataclysm", "Shadowshot: Deadfall", "Silkstrike", "Blade Barrage", "Chaos Reach",
    "Storm's Edge", "Ward of Dawn", "Winter's Wrath", "Hammer of Sol",
    "Magnetic", "Storm", "Pulse", "Duskfield", "Shackle", "Coldsnap", "Suppressor", "Solar",
    "Withering Blade", "Threaded Spike", "Frenzied Blade", "Arcane Needle", "Incinerator Snap", "Throwing Hammer",
    "Chain Lightning", "Ball Lightning", "Pocket Singularity", "Snare Bomb", "Hammer Strike",
    "Gambler's Dodge", "Rally Barricade", "Empowering Rift", "Phoenix Dive",
    "Flow State", "Tempest Strike", "Lethal Current", "Ionic Sentry", "Lightning Surge", "Arc Soul",
    "Knock 'Em Down", "On Your Mark", "Sol Invictus", "Roaring Flames", "Heat Rises", "Icarus Dash", "Touch of Flame",
    "Trapper's Ambush", "Offensive Bulwark", "Controlled Demolition", "Chaos Accelerant", "Bastion", "Unbreakable",
    "Winter's Shroud", "Touch of Winter", "Howl of the Storm", "Tectonic Harvest", "Glacial Harvest", "Frostpulse",
    "Widow's Silk", "Drengr's Lash", "Flechette Storm", "Mindspun Invocation", "Whirling Maelstrom", "The Wanderer",
    "Spark of Frequency", "Spark of Amplitude", "Spark of Discharge", "Spark of Recharge", "Spark of Magnitude",
    "Ember of Searing", "Ember of Char", "Ember of Solace", "Ember of Singeing", "Ember of Wonder", "Ember of Benevolence",
    "Echo of Expulsion", "Echo of Persistence", "Echo of Leeching", "Echo of Harvest", "Echo of Domineering", "Echo of Provision",
    "Whisper of Fissures", "Whisper of Hedrons", "Whisper of Durance", "Whisper of Rime", "Whisper of Bonds", "Whisper of Impetus",
    "Thread of Propagation", "Thread of Continuity", "Thread of Evolution", "Thread of Fury", "Thread of Mind",
    "Thread of Isolation", "Thread of Ascent",
    "Facet of Balance", "Facet of Command", "Facet of Hope", "Facet of Honor", "Facet of Mending", "Facet of Devotion",
    "Facet of Defiance", "Facet of Dominance", "Facet of Generosity", "Facet of Grace", "Facet of Sacrifice"
  ],
  B: [
    // everything not listed elsewhere is B; these are listed for reference
    "Stormtrance", "Bladefury", "Daybreak", "Burning Maul", "Gathering Storm", "Nova Warp", "Glacial Quake",
    "Silence and Squall", "Spectral Blades", "Shadowshot: Moebius Quiver", "Golden Gun: Deadshot", "Fists of Havoc",
    "Sentinel Shield",
    "Arcbolt", "Flux", "Fusion", "Swarm", "Thermite", "Glacier", "Void Wall", "Axion Bolt", "Scatter", "Incendiary",
    "Lightning", "Firebolt", "Tripmine", "Void Spike",
    "Marksman's Dodge", "Towering Barricade", "Healing Rift", "Acrobat's Dodge", "Thruster",
    "Touch of Thunder", "Electrostatic Mind", "Storm's Keep", "Crackshot", "On the Prowl", "Vanishing Step",
    "Soul Siphon", "Grim Harvest", "Shatterdive", "Cryoclasm", "Iceflare Bolts", "Ensnaring Slam", "Weavewalk", "Into the Fray"
  ],
  C: [
    "Arc Staff", "Nova Bomb: Vortex",
    "Skip", "Shatter", "Slicewire",
    "Shiver Strike", "Penumbral Blast", "Celestial Fire", "Proximity Explosive Knife", "Weighted Throwing Knife",
    "Lightweight Knife", "Shield Bash", "Ballistic Slam", "Seismic Strike", "Disorienting Blow", "Phantom Surge",
    "Spark of Haste", "Spark of Instinct", "Spark of Feedback", "Spark of Brilliance", "Spark of Beacons",
    "Ember of Beams", "Ember of Eruption", "Ember of Tempering", "Ember of Resolve", "Ember of Combustion",
    "Ember of Mercy", "Ember of Blistering",
    "Echo of Dilation", "Echo of Obscurity", "Echo of Cessation", "Echo of Exchange", "Echo of Remnants",
    "Echo of Vigilance", "Echo of Reprisal",
    "Whisper of Chill", "Whisper of Refraction", "Whisper of Conduction", "Whisper of Hunger", "Whisper of Reversal",
    "Whisper of Rending", "Whisper of Fractures", "Whisper of Torment",
    "Thread of Rebirth", "Thread of Wisdom", "Thread of Transmutation", "Thread of Finality", "Thread of Binding",
    "Facet of Bravery", "Facet of Justice", "Facet of Solitude", "Facet of Blessing", "Facet of Awakening"
  ],
  D: [
    "Flashbang", "Juggernaut", "Shieldburst",
    "Spark of Focus", "Spark of Momentum", "Spark of Resistance"
  ]
};

/* Odds of each tier by reward level. Reward level = event power (tier + difficulty) + 1 if flawless.
   Solo Ops on Normal = 2, Fireteam Ops on Expert = 5, Pinnacle on Master = 7, Grandmaster dungeon = 8+. */
window.D2R_REWARD_ODDS = [
  {upTo: 3,        S: 0,  A: 5,  B: 25, C: 40, D: 30},
  {upTo: 5,        S: 5,  A: 20, B: 35, C: 30, D: 10},
  {upTo: 7,        S: 15, A: 35, B: 30, C: 15, D: 5},
  {upTo: Infinity, S: 30, A: 40, B: 25, C: 5,  D: 0}
];
