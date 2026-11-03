# D2 Roguelite

A roguelite run tracker for Destiny 2. Each run starts on a fixed base build with common gear, earns loot and abilities from activities you clear, and ends when you run out of lives.

**Play:** https://pwancake117.github.io/d2-roguelite/

## Before your first run: pull common gear from Collections

The app equips your starting gear for you, but it can only use items you own. Collections can't be reached through Bungie's API, so this one step happens in game.

### Weapons (once per account, shared by all classes)
Open **Collections → Weapons** and pull one of each:

| Slot | Rarity | Examples |
|---|---|---|
| Kinetic | White (common) | Khvostov 7G-02, One Earth, Pariah, Picayune Mk. 33, Lost and Found |
| Energy | White (common) | Stay Away, Helios HC1, Etude-12, Sorrow MG2, Equinox Tsu, Stubborn Oak |
| Power | Green (uncommon) | Butler RS/2, Gareth-C, Hadrian-A, Para Torus I, Penumbra GSm |

Destiny 2 has no white power weapon, so the power slot starts at green.

One copy of each is enough. If another character has them equipped, the app equips a stand-in on that character and moves the weapons over. Pull extra copies if you'd rather each class keep its own.

### Armor (once per class)
Armor is class-locked, and Collections only shows armor for the class you're playing. Log in on each class you want to run, open **Collections → Armor** and pull a white **helmet, gauntlets, chest, legs and class item**:

| Class | Example white sets |
|---|---|
| Hunter | Wastelander, Daring Hunter, Scorched Hunter, Refugee |
| Titan | Renegade, Brave Titan, Wrecked Titan, Refugee |
| Warlock | Wise Warlock, Damaged Warlock, Aspirant |

Any white pieces work and can be mixed. The more you own, the more each run's starting kit varies.

Once you're connected, the app's **Setup guide** shows which classes are ready and which pieces are missing.

## Playing
**Recommended before each run:** move everything on that character except your common starter gear to the vault, empty its Postmaster, and clear your artifact's mod slots. Then anything that shows up on your character during the run is clearly run loot. Once a run has started, the **Move other gear to vault** button in the Bungie panel does this for you (it leaves run gear alone).

1. **Connect your Bungie account.** Sign-in happens on bungie.net. The app asks to read your inventory and to move or equip gear.
2. **Pick a class and subclass, then start the run.** The app moves your common gear to that character, equips it and sets the subclass's base build.
3. **Play Vanguard Ops** (Director → Vanguard Ops: Solo, Fireteam, Arena or Pinnacle Ops). Each finished op is synced from Bungie and logged automatically.
4. **Use what you find.** Any weapon or armor piece you pick up during the run (including Postmaster drops) is added to your run and is yours to equip. The game's own difficulty decides how good the drops are.
5. **Unlock abilities.** Every completed event gives an ability pick (a new super, grenade, jump, melee, class ability, aspect, fragment, extra life; see Reward tiers below). Clears also earn Light, and every 4 Light adds a bonus pick, so harder and flawless clears unlock more. The app sets it on your subclass in game automatically (you can turn that off). Gear is never equipped for you: loot stays where it drops until you equip it. Bungie only allows gear changes in orbit or social spaces.

Artifact: Destiny 2 has seven artifacts (NPA Repulsion Regulator, Queensfoil Censer, Hunter's Journal, Tablet of Ruin, Slayer Baron Apothecary Satchel, Implement of Curiosity, Encrypted Data Disk), one equipped at a time, each with 7 mod slots. You start a run with no artifact: after your first completed event you get a bonus pick of 3 artifacts. Swapping to a different artifact later is an S-tier reward (it frees all your points). Every completed event earns artifact points by difficulty: 1 (Normal to Expert), 2 (Master), 3 (Grandmaster/Ultimate), +1 if flawless; dungeon encounters earn the same by difficulty, and **+2 Artifact Points** is a B-tier reward. Spend points to fill slots: a mod costs its tier; slots 1-2 take tier 1 mods, slots 3-5 up to tier 2, slots 6-7 up to tier 3. Reset is free and refunds every point. Bungie doesn't let apps change artifact mods, so you set them in game; the app checks your equipped artifact and each slot.

### Reward tiers

Rewards are tiered by type (set in `tiers.js`):

| Tier | Rewards |
|---|---|
| S | Supers, swap to a different artifact |
| A | Aspects (at most 2 per pick, and only as many as you have open aspect slots) |
| B | Fragments (offered even when your slots are full, with a warning; the fragment waits until an aspect opens room), extra lives (+1 Life, sometimes +2 Lives; up to 2 over your starting lives), +2 artifact points |
| C | Grenades, jumps, melees, class abilities |

Each of the 3 choices in a pick rolls a tier, then a reward inside it, so a pick can offer two aspects or two supers. Harder events roll higher tiers more often. Reward level = event power (tier + difficulty), +1 for a flawless clear:

| Reward level | S | A | B | C |
|---|---|---|---|---|
| up to 3 (e.g. Solo Ops, Normal) | 5% | 25% | 25% | 45% |
| 4–5 | 10% | 30% | 30% | 30% |
| 6–7 | 20% | 30% | 30% | 20% |
| 8+ (e.g. Grandmaster) | 30% | 30% | 30% | 10% |

Master and Grandmaster boost S: on Master, half of all picks include a guaranteed S reward (about 80% of picks end up with one), and on Grandmaster/Ultimate 95% do (about 98% overall).

Each pick card shows its tier, and the **Reward tier list** button shows everything for your subclass. To change tiers or odds, edit `tiers.js`.

## Modes and deaths
| | Normal | Hardcore |
|---|---|---|
| Clear with no deaths | Power + 2 bonus Light, +25 score | Same |
| Clear with deaths | Light reduced by 1 per death (min 1), no other penalty | Lose a life **and every looted item you had equipped** |
| Failed, or left after 5 minutes | Lose a life | Lose a life and your equipped loot |
| Left within 5 minutes | Doesn't count | Doesn't count |
| Starter commons | Never lost | Never lost |

Power = Solo Ops 2, Fireteam/Arena Ops 3, Pinnacle Ops 4, plus 0–4 for difficulty. Lost loot is removed from your run; what you do with it in game is up to you. At 0 lives the run is over.

Only Vanguard Ops activities count as events, since each has a clear start and finish. Event tier: Solo Ops 2, Fireteam Ops 3, Arena Ops 3, Pinnacle Ops 4, plus 0–4 for difficulty (Normal through Grandmaster/Ultimate). Patrols, campaign missions, Lost Sectors, dungeons, raids, Crucible and Gambit don't count.

## Dungeon Only Run
Pick **Dungeon Only Run** on the setup screen for a run where only dungeons count.
- The app detects when you're in a dungeon (it checks every 20 seconds) and shows a **Dungeon tracker**.
- Tap **Encounter cleared** after each boss or major fight: every encounter gives an ability unlock.
- When the dungeon ends, Bungie's record logs the clear (Light), your deaths and the loot you picked up.
- Bungie's API doesn't report dungeon encounters, so the encounter tap is the one manual step.

## Export
Download your runs as CSV (one row per event) or JSON from Run history. Run data is stored in your own browser.
