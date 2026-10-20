-- standalone helper module (.p8.lua)
function clamp_speed(v, max_v)
  if (v > max_v) return max_v
  if (v < -max_v) return -max_v
  return v
end
