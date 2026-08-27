# bench-MiMo-V2.5-minecraft

Minecraft clone built entirely in the browser using Three.js and procedural canvas textures. No external assets required.

## Features

- Procedural terrain with simplex noise (hills, caves, sand beaches)
- Chunk-based world with face culling for performance
- Canvas-generated texture atlas (grass, dirt, stone, sand, water, wood, leaves)
- Player physics with gravity and AABB collision
- Block placement and destruction with raycasting
- Procedural tree generation
- Infinite world with chunk streaming
- Block highlight on targeted block
- Hotbar with 5 block types (1-5 keys or scroll wheel)

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look around |
| Space | Jump / Fly up |
| Shift | Sprint / Fly down |
| Left Click | Mine block |
| Right Click | Place block |
| 1-5 / Scroll | Select block |
| T | Open chat |
| Escape | Pause |

## Chat Commands

| Command | Description |
|---------|-------------|
| `/gamemode survival\|creative` | Switch game mode |
| `/fly` | Toggle fly mode |
| `/time day\|night` | Change time of day |
| `/tp <x> <y> <z>` | Teleport |
| `/seed` | Show world seed |
| `/clear` | Clear chat |
| `/help` | List commands |

## How to Run

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Tech Stack

- Three.js r128 (CDN)
- Simplex noise (3D)
- Canvas 2D texture atlas
- No build tools, no dependencies, single HTML file
