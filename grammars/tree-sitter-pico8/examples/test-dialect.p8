pico-8 cartridge // http://www.pico-8.com
version 43
__lua__
-- Pico-8 Lua dialect features

-- numeric literals
a = 0x1a.bc
b = 0b1010
c = 0xff
d = 1.5

-- bitwise + integer division
e = 5 \ 2
f = 0xff & 0x0f
g = 0x10 | 0x01
h = 0xaa ^^ 0x55
i = 1 << 4
j = 256 >> 2
k = -1 >>> 2
l = 0x1234 <<> 4
m = 0x1234 >>< 4
n = ~0xff

-- compound assignments
x = 0
x += 1
x -= 1
x *= 2
x /= 2
x %= 3
x \= 2
x ^= 2
x &= 0xff
x |= 0x0f
x ^^= 0x55
x <<= 1
x >>= 1
x >>>= 1
x <<>= 1
x >><= 1
x ..= "z"

-- "!=" is an alias for "~="
if a != b then
 print("different")
end

-- "//" line comment
// this is a Pico-8 comment
y = 1 // also a comment

-- "?" print statement
?"hello"
?"x =", x, "y =", y

-- peek shorthand operators
w = @0x5f00
w2 = %0x5f00
w4 = $0x5f00

-- shorthand "if"
if (a < b) x = 1
if (a < b) x = 1 else x = 2
if (a < b) return 42

-- shorthand "while"
while (x > 0) x -= 1

-- standard "if" still works
if a == 1 then
 x = 10
elseif a == 2 then
 x = 20
else
 x = 30
end

-- identifiers with Pico-8 glyphs
function check_buttons()
 if btnp(🅾️) then return 1 end
 if btnp(❎) then return 2 end
 return 0
end

-- "for" loops
for i = 1, 10 do
 ?i
end

for k, v in pairs({1, 2, 3}) do
 ?k, v
end

-- tables and method calls
t = {a = 1, b = 2, [3] = "three"}
function t:greet(name)
 return "hello " .. name
end
?t:greet("world")
__gfx__
00000000
11111111
22222222
__gff__
0000
__map__
0000
__sfx__
000100000000
__music__
00 41424344
