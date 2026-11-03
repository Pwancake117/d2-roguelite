/* D2 Roguelite starter builds: what every run starts with, per class and subclass.
   Edit a name to change a starter build. Names must match the options listed in the comment above each build
   (anything that does not match falls back to the first option). Everything not in the starter build is an unlock reward. */
window.D2R_STARTERS = {
  "Hunter": {
    /* arc options
       super: Gathering Storm, Arc Staff, Storm's Edge
       grenade: Skip, Arcbolt, Pulse, Storm, Flashbang, Lightning, Flux
       jump: High Jump, Strafe Jump, Triple Jump, Blink
       melee: Disorienting Blow, Combination Blow
       classAbility: Marksman's Dodge, Gambler's Dodge
    */
    "arc": {super: "Arc Staff", grenade: "Flashbang", jump: "High Jump", melee: "Disorienting Blow", classAbility: "Marksman's Dodge"},
    /* solar options
       super: Golden Gun: Marksman, Golden Gun: Deadshot, Blade Barrage
       grenade: Fusion, Healing, Firebolt, Solar, Incendiary, Tripmine, Swarm, Thermite
       jump: High Jump, Strafe Jump, Triple Jump
       melee: Knife Trick, Proximity Explosive Knife, Lightweight Knife, Weighted Throwing Knife
       classAbility: Acrobat's Dodge, Marksman's Dodge, Gambler's Dodge
    */
    "solar": {super: "Golden Gun: Deadshot", grenade: "Solar", jump: "High Jump", melee: "Lightweight Knife", classAbility: "Marksman's Dodge"},
    /* void options
       super: Shadowshot: Moebius Quiver, Spectral Blades, Shadowshot: Deadfall
       grenade: Vortex, Void Spike, Scatter, Magnetic, Suppressor, Void Wall, Axion Bolt
       jump: High Jump, Strafe Jump, Triple Jump
       melee: Phantom Surge, Snare Bomb
       classAbility: Marksman's Dodge, Gambler's Dodge
    */
    "void": {super: "Shadowshot: Moebius Quiver", grenade: "Magnetic", jump: "High Jump", melee: "Snare Bomb", classAbility: "Marksman's Dodge"},
    /* stasis options
       super: Silence and Squall
       grenade: Duskfield, Glacier, Shatter, Coldsnap
       jump: High Jump, Strafe Jump, Triple Jump
       melee: Withering Blade
       classAbility: Marksman's Dodge, Gambler's Dodge
    */
    "stasis": {super: "Silence and Squall", grenade: "Coldsnap", jump: "High Jump", melee: "Withering Blade", classAbility: "Marksman's Dodge"},
    /* strand options
       super: Silkstrike
       grenade: Slicewire, Grapple, Shackle, Threadling
       jump: High Jump, Strafe Jump, Triple Jump
       melee: Threaded Spike
       classAbility: Gambler's Dodge, Marksman's Dodge
    */
    "strand": {super: "Silkstrike", grenade: "Grapple", jump: "High Jump", melee: "Threaded Spike", classAbility: "Marksman's Dodge"},
    /* prismatic options
       super: Silkstrike, Storm's Edge, Shadowshot: Deadfall, Golden Gun: Marksman, Silence and Squall
       grenade: Magnetic, Swarm, Arcbolt, Duskfield, Grapple
       jump: High Jump, Strafe Jump, Triple Jump, Blink
       melee: Threaded Spike, Combination Blow, Withering Blade, Knife Trick, Snare Bomb
       classAbility: Marksman's Dodge, Gambler's Dodge, Acrobat's Dodge
    */
    "prismatic": {super: "Silkstrike", grenade: "Arcbolt", jump: "High Jump", melee: "Knife Trick", classAbility: "Marksman's Dodge"}
  },
  "Titan": {
    /* arc options
       super: Thundercrash, Fists of Havoc
       grenade: Skip, Arcbolt, Pulse, Storm, Flashbang, Lightning, Flux
       jump: High Lift, Strafe Lift, Catapult Lift
       melee: Ballistic Slam, Seismic Strike, Thunderclap
       classAbility: Towering Barricade, Rally Barricade, Thruster
    */
    "arc": {super: "Fists of Havoc", grenade: "Flashbang", jump: "Strafe Lift", melee: "Ballistic Slam", classAbility: "Towering Barricade"},
    /* solar options
       super: Burning Maul, Hammer of Sol
       grenade: Fusion, Healing, Firebolt, Solar, Incendiary, Tripmine, Swarm, Thermite
       jump: High Lift, Strafe Lift, Catapult Lift
       melee: Hammer Strike, Throwing Hammer
       classAbility: Towering Barricade, Rally Barricade
    */
    "solar": {super: "Hammer of Sol", grenade: "Solar", jump: "Strafe Lift", melee: "Hammer Strike", classAbility: "Towering Barricade"},
    /* void options
       super: Sentinel Shield, Ward of Dawn, Twilight Arsenal
       grenade: Vortex, Void Spike, Scatter, Magnetic, Suppressor, Void Wall, Axion Bolt
       jump: High Lift, Strafe Lift, Catapult Lift
       melee: Shield Throw, Shield Bash
       classAbility: Towering Barricade, Rally Barricade
    */
    "void": {super: "Ward of Dawn", grenade: "Magnetic", jump: "Strafe Lift", melee: "Shield Bash", classAbility: "Towering Barricade"},
    /* stasis options
       super: Glacial Quake
       grenade: Duskfield, Glacier, Shatter, Coldsnap
       jump: High Lift, Strafe Lift, Catapult Lift
       melee: Shiver Strike
       classAbility: Towering Barricade, Rally Barricade
    */
    "stasis": {super: "Glacial Quake", grenade: "Glacier", jump: "Strafe Lift", melee: "Shiver Strike", classAbility: "Towering Barricade"},
    /* strand options
       super: Bladefury
       grenade: Slicewire, Grapple, Shackle, Threadling
       jump: High Lift, Strafe Lift, Catapult Lift
       melee: Frenzied Blade
       classAbility: Rally Barricade, Towering Barricade
    */
    "strand": {super: "Bladefury", grenade: "Shackle", jump: "Strafe Lift", melee: "Frenzied Blade", classAbility: "Towering Barricade"},
    /* prismatic options
       super: Thundercrash, Hammer of Sol, Twilight Arsenal, Glacial Quake, Bladefury
       grenade: Pulse, Thermite, Suppressor, Glacier, Shackle
       jump: High Lift, Strafe Lift, Catapult Lift
       melee: Thunderclap, Hammer Strike, Shield Throw, Shiver Strike, Frenzied Blade
       classAbility: Towering Barricade, Rally Barricade, Thruster
    */
    "prismatic": {super: "Bladefury", grenade: "Suppressor", jump: "Strafe Lift", melee: "Hammer Strike", classAbility: "Towering Barricade"}
  },
  "Warlock": {
    /* arc options
       super: Stormtrance, Chaos Reach
       grenade: Skip, Arcbolt, Pulse, Storm, Flashbang, Lightning, Flux
       jump: Strafe Glide, Burst Glide, Balanced Glide
       melee: Ball Lightning, Chain Lightning
       classAbility: Empowering Rift, Healing Rift
    */
    "arc": {super: "Stormtrance", grenade: "Flashbang", jump: "Strafe Glide", melee: "Chain Lightning", classAbility: "Healing Rift"},
    /* solar options
       super: Song of Flame, Daybreak, Well of Radiance
       grenade: Fusion, Healing, Firebolt, Solar, Incendiary, Tripmine, Swarm, Thermite
       jump: Strafe Glide, Burst Glide, Balanced Glide
       melee: Incinerator Snap, Celestial Fire
       classAbility: Phoenix Dive, Empowering Rift, Healing Rift
    */
    "solar": {super: "Daybreak", grenade: "Solar", jump: "Strafe Glide", melee: "Celestial Fire", classAbility: "Healing Rift"},
    /* void options
       super: Nova Warp, Nova Bomb: Vortex, Nova Bomb: Cataclysm
       grenade: Vortex, Void Spike, Scatter, Magnetic, Suppressor, Void Wall, Axion Bolt
       jump: Strafe Glide, Burst Glide, Balanced Glide, Blink
       melee: Pocket Singularity
       classAbility: Empowering Rift, Healing Rift
    */
    "void": {super: "Nova Bomb: Vortex", grenade: "Vortex", jump: "Strafe Glide", melee: "Pocket Singularity", classAbility: "Healing Rift"},
    /* stasis options
       super: Winter's Wrath
       grenade: Duskfield, Glacier, Shatter, Coldsnap
       jump: Strafe Glide, Burst Glide, Balanced Glide
       melee: Penumbral Blast
       classAbility: Empowering Rift, Healing Rift
    */
    "stasis": {super: "Winter's Wrath", grenade: "Coldsnap", jump: "Strafe Glide", melee: "Penumbral Blast", classAbility: "Healing Rift"},
    /* strand options
       super: Needlestorm
       grenade: Slicewire, Grapple, Shackle, Threadling
       jump: Strafe Glide, Burst Glide, Balanced Glide
       melee: Arcane Needle
       classAbility: Healing Rift, Empowering Rift
    */
    "strand": {super: "Needlestorm", grenade: "Threadling", jump: "Strafe Glide", melee: "Arcane Needle", classAbility: "Healing Rift"},
    /* prismatic options
       super: Stormtrance, Song of Flame, Nova Bomb: Cataclysm, Winter's Wrath, Needlestorm
       grenade: Storm, Healing, Vortex, Coldsnap, Threadling
       jump: Strafe Glide, Burst Glide, Balanced Glide, Blink
       melee: Arcane Needle, Chain Lightning, Incinerator Snap, Pocket Singularity, Penumbral Blast
       classAbility: Healing Rift, Empowering Rift, Phoenix Dive
    */
    "prismatic": {super: "Song of Flame", grenade: "Healing", jump: "Strafe Glide", melee: "Arcane Needle", classAbility: "Healing Rift"}
  }
};
