pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
-- p8 demo cartridge for zed-pico8
-- showcases pico-8 lua dialect & api intellisense

#include standalone.p8.lua

local player = {
  x = 64,
  y = 64,
  vx = 0,
  vy = 0,
  spr = 1,
  score = 0,
  mask = 0b1010.010,
  fixed = 0x11.4000,
}

-->8
-- lifecycle callbacks

function _init()
  music(0, 200, 3)
  pal(15, 0x80, 1)
end

function _update60()
  -- button glyph constants & short-form if statements
  if (btn(⬅️)) player.vx -= 0.25
  if (btn(➡️)) player.vx += 0.25
  if (btn(⬆️)) player.vy -= 0.25
  if (btn(⬇️)) player.vy += 0.25
  if (btnp(🅾️) or btnp(❎)) sfx(0)

  -- compound assignments, integer division (\), !=, and bitwise ops
  player.vx = clamp_speed(player.vx * 0.85, 2.5)
  player.vy = clamp_speed(player.vy * 0.85, 2.5)
  player.x += player.vx
  player.y += player.vy

  local tile_x = player.x \ 8
  local tile_y = player.y \ 8
  local tile = mget(tile_x, tile_y)

  if (tile != 0 and (fget(tile) & 0b0001) != 0) then
    player.score += 1
    mset(tile_x, tile_y, 0)
  end

  -- memory peek operators (@byte, %int16, $fixed32)
  local frame_byte = @0x5f25
  local hw_word = %0x5f00
  local rng_state = $0x5f44
end

function _draw()
  cls(1)
  map(0, 0, 0, 0, 16, 16)
  spr(player.spr, player.x - 4, player.y - 4)
  circfill(player.x, player.y - 8, 2, 10)
  ?"score: "..player.score, 4, 4, 7
  ?"cpu: "..flr(stat(1) * 100).."%", 4, 12, 6
end

__gfx__
000000000000000000777700007aa700007aa700007777000007700000700700
__gff__
0001000000000000000000000000000000000000000000000000000000000000
__map__
0000000000000000000000000000000000000000000000000000000000000000
__sfx__
000100000c3000e300113001430017300193001c3001e300203000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
__music__
00 41424344
