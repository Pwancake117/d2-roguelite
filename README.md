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
3. **Play.** Finished PvE activities are synced from Bungie and logged automatically: clears earn loot and Light (every 4 Light unlocks an ability pick), deaths cost a life and a looted item.
4. **Pick rewards in the app.** The app updates your loadout in game after each pick. Bungie only allows gear changes in orbit or social spaces.

PvE only: Crucible and Gambit are not tracked.

## Export
Download your runs as CSV (one row per event) or JSON from Run history. Run data is stored in your own browser.
