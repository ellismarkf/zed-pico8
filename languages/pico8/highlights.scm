; PICO-8 cartridge structure
(cartridge_line) @comment.doc

(version_line
  "version" @keyword
  number: (version_number) @number)

(section_marker) @preproc

(opaque_content
  (data_line) @string.special)

; PICO-8 #include directive
(include_statement
  (include_keyword) @preproc
  path: (include_path) @string.special)

; Keywords
"local" @keyword

[
  "do"
  "else"
  "elseif"
  "end"
  "for"
  "function"
  "goto"
  "if"
  "in"
  "repeat"
  "return"
  "then"
  "until"
  "while"
  (break_statement)
] @keyword.control

(label_statement) @label

; Operators (including PICO-8 compound assignments, !=, \, bitwise, and @ % $ peek ops)
(binary_expression
  operator: _ @operator)

(unary_expression
  operator: _ @operator)

(compound_assignment_statement
  operator: _ @operator)

(print_statement
  "?" @function.builtin)

"=" @operator

[
  "and"
  "not"
  "or"
] @keyword.operator

; Punctuation & Delimiters
[
  ";"
  ":"
  "::"
  ","
  "."
] @punctuation.delimiter

; Brackets
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "[["
  "]]"
] @punctuation.bracket

; Variables
(identifier) @variable

((identifier) @variable.special
  (#eq? @variable.special "self"))

(variable_list
  (attribute
    "<" @punctuation.bracket
    (identifier) @attribute
    ">" @punctuation.bracket))

; Constants & PICO-8 Built-in Glyph Constants
((identifier) @constant
  (#match? @constant "^[A-Z][A-Z_0-9]*$"))

((identifier) @constant.builtin
  (#any-of? @constant.builtin
    "_ENV"
    "⬅️" "➡️" "⬆️" "⬇️" "🅾️" "❎"
    "█" "▒" "🐱" "░" "✽" "●" "♥" "☉" "웃" "⌂"
    "😐" "♪" "◆" "…" "★" "⧗" "ˇ" "∧" "▤" "▥"))

(vararg_expression) @constant.builtin

(nil) @constant.builtin

[
  (false)
  (true)
] @boolean

; Tables
(field
  name: (identifier) @property)

(dot_index_expression
  field: (identifier) @property)

(table_constructor
  [
    "{"
    "}"
  ] @constructor)

; Functions & Parameters
(parameters
  (identifier) @variable.parameter)

(function_declaration
  name: [
    (identifier) @function
    (dot_index_expression
      field: (identifier) @function)
  ])

(function_declaration
  name: (method_index_expression
    method: (identifier) @function.method))

(assignment_statement
  (variable_list
    .
    name: [
      (identifier) @function
      (dot_index_expression
        field: (identifier) @function)
    ])
  (expression_list
    .
    value: (function_definition)))

(table_constructor
  (field
    name: (identifier) @function
    value: (function_definition)))

(function_call
  name: [
    (identifier) @function
    (dot_index_expression
      field: (identifier) @function)
    (method_index_expression
      method: (identifier) @function.method)
  ])

; Complete PICO-8 Built-in API Functions
(function_call
  name: (identifier) @function.builtin
  (#any-of? @function.builtin
    ; graphics
    "camera" "circ" "circfill" "clip" "cls" "color" "cursor" "fget" "fillp"
    "flip" "fset" "line" "oval" "ovalfill" "pal" "palt" "pget" "print"
    "pset" "rect" "rectfill" "rrect" "rrectfill" "sget" "spr" "sset" "sspr"
    "tline"
    ; map
    "map" "mapdraw" "mget" "mset"
    ; input
    "btn" "btnp"
    ; audio
    "music" "sfx"
    ; math & bitwise
    "abs" "atan2" "band" "bnot" "bor" "bxor" "ceil" "cos" "flr" "lshr"
    "max" "mid" "min" "rnd" "rotl" "rotr" "sgn" "shl" "shr" "sin" "sqrt"
    "srand"
    ; tables
    "add" "all" "count" "del" "deli" "foreach" "ipairs" "next" "pack"
    "pairs" "unpack"
    ; strings & types
    "chr" "ord" "split" "sub" "tonum" "tonumber" "tostr" "tostring" "type"
    ; memory & cartridge data
    "cartdata" "cstore" "dget" "dset" "memcpy" "memset" "peek" "peek2"
    "peek4" "poke" "poke2" "poke4" "reload" "serial"
    ; coroutines
    "cocreate" "coresume" "costatus" "coyield" "yield"
    ; system, metatables & debugging
    "assert" "dir" "error" "extcmd" "folder" "getmetatable" "holdframe"
    "info" "load" "ls" "menuitem" "printh" "rawequal" "rawequals" "rawget"
    "rawlen" "rawset" "reboot" "reset" "resume" "run" "save" "select"
    "setmetatable" "stat" "stop" "t" "time" "trace"))

; PICO-8 Lifecycle Callbacks (_init, _update, _update60, _draw)
(function_declaration
  name: (identifier) @function @function.special
  (#any-of? @function.special "_init" "_update" "_update60" "_draw"))

(function_call
  name: (identifier) @function @function.special
  (#any-of? @function.special "_init" "_update" "_update60" "_draw"))

; Literals & Comments
(comment) @comment

(number) @number

(string) @string

(escape_sequence) @string.escape
