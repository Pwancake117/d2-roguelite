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
1. **Connect your Bungie account.** Sign-in happens on bungie.net. The app asks to read your inventory and to move or equip gear.
2. **Pick a class and subclass, then start the run.** The app moves your common gear to that character, equips it and sets the subclass's base build.
3. **Play Vanguard Ops** (Director → Vanguard Ops: Solo, Fireteam, Arena or Pinnacle Ops). Each finished op is synced from Bungie and logged automatically.
4. **Use what you find.** Any weapon or armor piece you pick up during the run (including Postmaster drops) is added to your run and is yours to equip. The game's own difficulty decides how good the drops are.
5. **Unlock abilities.** Clears earn Light; every 4 Light unlocks a pick of a new super, grenade, melee, class ability, aspect, fragment or extra life. The app sets it on your subclass in game. Bungie only allows gear changes in orbit or social spaces.

## Modes and deaths
| | Normal | Hardcore |
|---|---|---|
| Clear with no deaths | Power + 2 bonus Light, +25 score | Same |
| Clear with deaths | Light reduced by 1 per death (min 1), no other penalty | Lose a life **and every looted item you had equipped** |
| Failed or wiped out | Lose a life | Lose a life and your equipped loot |
| Starter commons | Never lost | Never lost |

Power = Solo Ops 2, Fireteam/Arena Ops 3, Pinnacle Ops 4, plus 0–4 for difficulty. Lost loot is removed from your run; what you do with it in game is up to you. At 0 lives the run is over.

Only Vanguard Ops activities count as events, since each has a clear start and finish. Event tier: Solo Ops 2, Fireteam Ops 3, Arena Ops 3, Pinnacle Ops 4, plus 0–4 for difficulty (Normal through Grandmaster/Ultimate). Patrols, campaign missions, Lost Sectors, dungeons, raids, Crucible and Gambit don't count.

## Dungeon Only Run
Pick **Dungeon Only Run** on the setup screen for a run where only dungeons count.
- The app detects when you're in a dungeon (it checks every 30 seconds) and shows a **Dungeon tracker**.
- Tap **Encounter cleared** after each boss or major fight: every encounter gives an ability unlock.
- When the dungeon ends, Bungie's record logs the clear (Light), your deaths and the loot you picked up.
- Bungie's API doesn't report dungeon encounters, so the encounter tap is the one manual step.

## Export
Download your runs as CSV (one row per event) or JSON from Run history. Run data is stored in your own browser.
