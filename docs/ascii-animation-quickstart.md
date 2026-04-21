# Ypsilon14 AsciiAnimation Quickstart

## What's new

Added `AsciiAnimation` component with built-in cassette tape animation. Integrates seamlessly with existing screen JSON format.

## Usage

Add to any screen in `data/ypsilon14.json`:

```json
{
  "type": "ascii-animation",
  "loop": true,
  "fps": 8
}
```

**Props:**
- `frames` — array of ASCII strings (optional, defaults to `CASSETTE_FRAMES`)
- `fps` — frames per second (optional, default 8)
- `loop` — continuous loop (optional, default true)
- `className` — CSS class (optional)

## Example screens

**Loading screen with cassette + welcome text:**
```json
{
  "type": "screen",
  "content": [
    {"type": "ascii-animation", "loop": true, "fps": 6},
    {"type": "text", "text": "Ypsilon 14 online"},
    {"type": "prompt"}
  ]
}
```

**One-shot animation:**
```json
{
  "type": "ascii-animation",
  "fps": 12,
  "loop": false
}
```

## Custom frames

Override the cassette with your own:
```json
{
  "type": "ascii-animation",
  "frames": [
    "  /\\_/\\  ",
    " ( o.o ) ",
    "  > ^ <  ",
    " ( -.- ) ",
    "  > ^ <  "
  ],
  "fps": 4
}
```

## Component files

- `src/components/AsciiAnimation/index.tsx` — core component
- `src/components/AsciiAnimation/style.scss` — phosphor-green styling
- `src/components/Phosphor/index.tsx` — integrated (5-line edit)

## Test it

1. `npm start`
2. Add the example JSON to a screen
3. Watch the cassette spin

**Current commit:** `60b68a06` — fully working.
