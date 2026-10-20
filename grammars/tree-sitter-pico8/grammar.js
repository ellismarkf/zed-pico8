/**
 * @file Pico-8 grammar for Tree-sitter
 * @author Marcelo de Gomensoro Malheiros
 * @license MIT
 *
 * Based on the generic Lua grammar in grammar-lua.js, extended with
 * Pico-8 cartridge structure (header + named sections) and Pico-8's
 * Lua dialect features.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  OR: 1,        // or
  AND: 2,       // and
  COMPARE: 3,   // < > <= >= ~= != ==
  BIT_OR: 4,    // | ^^ <<> >><
  BIT_NOT: 5,   // ~
  BIT_AND: 6,   // &
  BIT_SHIFT: 7, // << >> >>>
  CONCAT: 8,    // ..
  PLUS: 9,      // + -
  MULTI: 10,    // * / // \ %
  UNARY: 11,    // not # - ~ @ % $
  POWER: 12,    // ^
};

const SECTION_NAMES = ['lua', 'gfx', 'gff', 'label', 'map', 'sfx', 'music'];

const list_seq = (rule, separator, trailing_separator = false) =>
  trailing_separator
    ? seq(rule, repeat(seq(separator, rule)), optional(separator))
    : seq(rule, repeat(seq(separator, rule)));

const optional_block = ($) => alias(optional($._block), $.block);

const name_list = ($) => list_seq(field('name', $.identifier), ',');

export default grammar({
  name: 'pico8',

  extras: ($) => [$.comment, /[ \t\r\n]/],

  supertypes: ($) => [$.statement, $.expression, $.declaration, $.variable, $.section],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.return_statement],
  ],

  rules: {
    // ----------------------------------------------------------------
    // Cartridge structure
    // ----------------------------------------------------------------

    source_file: ($) =>
      choice(
        seq(
          $.header,
          repeat($.section)
        ),
        repeat1($.section),
        optional($._block)
      ),

    header: ($) =>
      seq(
        field('cartridge_line', $.cartridge_line),
        field('version_line', $.version_line)
      ),

    cartridge_line: (_) => token(prec(2, /pico-8 cartridge[^\n]*/)),

    version_line: ($) =>
      seq('version', field('number', alias(/[0-9]+/, $.version_number))),

    section: ($) =>
      choice(
        $.lua_section,
        $.gfx_section,
        $.gff_section,
        $.label_section,
        $.map_section,
        $.sfx_section,
        $.music_section
      ),

    lua_section: ($) =>
      seq(alias($._lua_marker, $.section_marker), optional($._block)),

    gfx_section: ($) =>
      seq(
        alias($._gfx_marker, $.section_marker),
        optional(alias($._opaque_content, $.opaque_content))
      ),

    gff_section: ($) =>
      seq(
        alias($._gff_marker, $.section_marker),
        optional(alias($._opaque_content, $.opaque_content))
      ),

    label_section: ($) =>
      seq(
        alias($._label_marker, $.section_marker),
        optional(alias($._opaque_content, $.opaque_content))
      ),

    map_section: ($) =>
      seq(
        alias($._map_marker, $.section_marker),
        optional(alias($._opaque_content, $.opaque_content))
      ),

    sfx_section: ($) =>
      seq(
        alias($._sfx_marker, $.section_marker),
        optional(alias($._opaque_content, $.opaque_content))
      ),

    music_section: ($) =>
      seq(
        alias($._music_marker, $.section_marker),
        optional(alias($._opaque_content, $.opaque_content))
      ),

    // Section markers — high prec so they outrank Lua identifiers and
    // the catch-all data_line token at the same length.
    _lua_marker:   (_) => token(prec(50, '__lua__')),
    _gfx_marker:   (_) => token(prec(50, '__gfx__')),
    _gff_marker:   (_) => token(prec(50, '__gff__')),
    _label_marker: (_) => token(prec(50, '__label__')),
    _map_marker:   (_) => token(prec(50, '__map__')),
    _sfx_marker:   (_) => token(prec(50, '__sfx__')),
    _music_marker: (_) => token(prec(50, '__music__')),

    _opaque_content: ($) => repeat1($.data_line),

    // A single line of opaque section content, including the trailing
    // newline. The newline guarantees the match outranks any Lua token
    // (such as identifier) when the parser is in a non-Lua section,
    // since tokens that would otherwise stop at the newline are
    // strictly shorter.
    data_line: (_) => token(prec(1, /[^\n]+\n/)),

    // ----------------------------------------------------------------
    // Pico-8 Lua chunk
    // ----------------------------------------------------------------

    _block: ($) =>
      choice(
        seq(repeat1($.statement), optional($.return_statement)),
        seq(repeat($.statement), $.return_statement)
      ),

    statement: ($) =>
      choice(
        $.empty_statement,
        $.assignment_statement,
        $.compound_assignment_statement,
        $.function_call,
        $.label_statement,
        $.break_statement,
        $.goto_statement,
        $.do_statement,
        $.while_statement,
        $.repeat_statement,
        $.if_statement,
        $.shorthand_if_statement,
        $.shorthand_while_statement,
        $.for_statement,
        $.print_statement,
        $.include_statement,
        $.declaration
      ),

    // Pico-8 `#include <path>` directive
    include_statement: ($) =>
      seq(
        alias('#include', $.include_keyword),
        token.immediate(/[ \t]+/),
        field('path', alias(token.immediate(/[^\r\n]+/), $.include_path))
      ),

    return_statement: ($) =>
      seq(
        'return',
        optional(alias($._expression_list, $.expression_list)),
        optional(';')
      ),

    empty_statement: (_) => ';',

    // varlist '=' explist
    assignment_statement: ($) =>
      seq(
        alias($._variable_assignment_varlist, $.variable_list),
        field('operator', '='),
        alias($._variable_assignment_explist, $.expression_list)
      ),
    _variable_assignment_varlist: ($) =>
      list_seq(field('name', $.variable), ','),
    _variable_assignment_explist: ($) =>
      list_seq(field('value', $.expression), ','),

    // Pico-8 compound assignments: var op= exp
    compound_assignment_statement: ($) =>
      seq(
        field('name', $.variable),
        field(
          'operator',
          choice(
            '+=', '-=', '*=', '/=', '\\=', '%=', '..=',
            '^=', '&=', '|=', '^^=', '<<=', '>>=', '>>>=',
            '<<>=', '>><='
          )
        ),
        field('value', $.expression)
      ),

    label_statement: ($) => seq('::', $.identifier, '::'),

    break_statement: (_) => 'break',

    goto_statement: ($) => seq('goto', $.identifier),

    do_statement: ($) => seq('do', field('body', optional_block($)), 'end'),

    while_statement: ($) =>
      seq(
        'while',
        field('condition', $.expression),
        'do',
        field('body', optional_block($)),
        'end'
      ),

    // Pico-8 shorthand while: `while (cond) stmt` — no `do`/`end`,
    // single statement body.
    shorthand_while_statement: ($) =>
      prec(
        1,
        seq(
          'while',
          '(',
          field('condition', $.expression),
          ')',
          field('body', $.statement)
        )
      ),

    repeat_statement: ($) =>
      seq(
        'repeat',
        field('body', optional_block($)),
        'until',
        field('condition', $.expression)
      ),

    if_statement: ($) =>
      seq(
        'if',
        field('condition', $.expression),
        'then',
        field('consequence', optional_block($)),
        repeat(field('alternative', $.elseif_statement)),
        optional(field('alternative', $.else_statement)),
        'end'
      ),
    elseif_statement: ($) =>
      seq(
        'elseif',
        field('condition', $.expression),
        'then',
        field('consequence', optional_block($))
      ),
    else_statement: ($) => seq('else', field('body', optional_block($))),

    // Pico-8 shorthand if: `if (cond) stmt [else stmt]` — must use
    // parentheses, no `then`/`end`. We restrict the body to a single
    // statement since the grammar has no end-of-line anchor.
    shorthand_if_statement: ($) =>
      prec.right(
        1,
        seq(
          'if',
          '(',
          field('condition', $.expression),
          ')',
          field('consequence', choice($.statement, $.return_statement)),
          optional(
            seq('else', field('alternative', choice($.statement, $.return_statement)))
          )
        )
      ),

    for_statement: ($) =>
      seq(
        'for',
        field('clause', choice($.for_generic_clause, $.for_numeric_clause)),
        'do',
        field('body', optional_block($)),
        'end'
      ),
    for_generic_clause: ($) =>
      seq(
        alias($._name_list, $.variable_list),
        'in',
        alias($._expression_list, $.expression_list)
      ),
    for_numeric_clause: ($) =>
      seq(
        field('name', $.identifier),
        field('operator', '='),
        field('start', $.expression),
        ',',
        field('end', $.expression),
        optional(seq(',', field('step', $.expression)))
      ),
    _name_list: ($) => name_list($),

    // Pico-8 `?` print statement: `? exp [, exp]*`
    print_statement: ($) =>
      prec.right(
        seq(
          '?',
          alias($._expression_list, $.expression_list)
        )
      ),

    declaration: ($) =>
      choice(
        $.function_declaration,
        field(
          'local_declaration',
          alias($._local_function_declaration, $.function_declaration)
        ),
        field('local_declaration', $.variable_declaration)
      ),
    function_declaration: ($) =>
      seq('function', field('name', $._function_name), $._function_body),
    _local_function_declaration: ($) =>
      seq('local', 'function', field('name', $.identifier), $._function_body),
    _function_name: ($) =>
      choice(
        $._function_name_prefix_expression,
        alias(
          $._function_name_method_index_expression,
          $.method_index_expression
        )
      ),
    _function_name_prefix_expression: ($) =>
      choice(
        $.identifier,
        alias($._function_name_dot_index_expression, $.dot_index_expression)
      ),
    _function_name_dot_index_expression: ($) =>
      seq(
        field('table', $._function_name_prefix_expression),
        '.',
        field('field', $.identifier)
      ),
    _function_name_method_index_expression: ($) =>
      seq(
        field('table', $._function_name_prefix_expression),
        ':',
        field('method', $.identifier)
      ),

    variable_declaration: ($) =>
      seq(
        'local',
        choice(
          alias($._att_name_list, $.variable_list),
          alias($._variable_assignment, $.assignment_statement)
        )
      ),
    _variable_assignment: ($) =>
      seq(
        alias($._att_name_list, $.variable_list),
        field('operator', '='),
        alias($._variable_assignment_explist, $.expression_list)
      ),

    _att_name_list: ($) =>
      seq(
        optional(field('attribute', alias($._attrib, $.attribute))),
        list_seq(
          seq(
            field('name', $.identifier),
            optional(field('attribute', alias($._attrib, $.attribute)))
          ),
          ','
        )
      ),
    _attrib: ($) => seq('<', $.identifier, '>'),

    _expression_list: ($) => list_seq($.expression, ','),

    expression: ($) =>
      choice(
        $.nil,
        $.false,
        $.true,
        $.number,
        $.string,
        $.vararg_expression,
        $.function_definition,
        $.variable,
        $.function_call,
        $.parenthesized_expression,
        $.table_constructor,
        $.binary_expression,
        $.unary_expression
      ),

    nil: (_) => 'nil',
    false: (_) => 'false',
    true: (_) => 'true',

    // Pico-8 numbers: decimal, hex (with optional fractional part),
    // and binary literals.
    number: (_) => {
      const decimal_digits = /[0-9]+/;
      const decimal_literal = seq(
        choice(
          seq(optional(decimal_digits), '.', decimal_digits),
          seq(decimal_digits, optional('.'), optional(decimal_digits))
        ),
        optional(seq(/[eE]/, optional(/[+-]/), decimal_digits))
      );

      const hex_digits = /[a-fA-F0-9]+/;
      const hex_literal = seq(
        /0[xX]/,
        choice(
          seq(hex_digits, optional(seq('.', optional(hex_digits)))),
          seq('.', hex_digits)
        ),
        optional(seq(/[pP]/, optional(/[+-]/), decimal_digits))
      );

      const bin_digits = /[01]+/;
      const bin_literal = seq(
        /0[bB]/,
        choice(
          seq(bin_digits, optional(seq('.', optional(bin_digits)))),
          seq('.', bin_digits)
        )
      );

      return token(choice(hex_literal, bin_literal, decimal_literal));
    },

    string: ($) => choice($._quote_string, $._block_string),

    _quote_string: ($) =>
      choice(
        seq(
          field('start', alias('"', '"')),
          field(
            'content',
            optional(alias($._doublequote_string_content, $.string_content))
          ),
          field('end', alias('"', '"'))
        ),
        seq(
          field('start', alias("'", "'")),
          field(
            'content',
            optional(alias($._singlequote_string_content, $.string_content))
          ),
          field('end', alias("'", "'"))
        )
      ),

    _doublequote_string_content: ($) =>
      repeat1(choice(token.immediate(prec(1, /[^"\\]+/)), $.escape_sequence)),

    _singlequote_string_content: ($) =>
      repeat1(choice(token.immediate(prec(1, /[^'\\]+/)), $.escape_sequence)),

    // Simple `[[ ... ]]` long string. No level support since we have
    // no external scanner.
    _block_string: ($) =>
      seq(
        field('start', alias($._block_string_open, '[[')),
        field('content', alias($._block_string_body, $.string_content)),
        field('end', alias($._block_string_close, ']]'))
      ),
    _block_string_open: (_) => '[[',
    _block_string_close: (_) => ']]',
    _block_string_body: (_) => token.immediate(prec(1, /([^\]]|\][^\]])*/)),

    escape_sequence: () =>
      token.immediate(
        seq(
          '\\',
          choice(
            /[\nabfnrtv\\'"*#-|+^0]/,
            /z\s*/,
            /[0-9]{1,3}/,
            /x[0-9a-fA-F]{2}/
          )
        )
      ),

    vararg_expression: (_) => '...',

    function_definition: ($) => seq('function', $._function_body),
    _function_body: ($) =>
      seq(
        field('parameters', $.parameters),
        field('body', optional_block($)),
        'end'
      ),
    parameters: ($) => seq('(', optional($._parameter_list), ')'),
    _parameter_list: ($) =>
      choice(
        seq(name_list($), optional(seq(',', $._vararg_parameter))),
        $._vararg_parameter
      ),
    _vararg_parameter: ($) =>
      seq($.vararg_expression, optional(field('name', $.identifier))),

    _prefix_expression: ($) =>
      prec(1, choice($.variable, $.function_call, $.parenthesized_expression)),

    variable: ($) =>
      choice($.identifier, $.bracket_index_expression, $.dot_index_expression),
    bracket_index_expression: ($) =>
      seq(
        field('table', $._prefix_expression),
        '[',
        field('field', $.expression),
        ']'
      ),
    dot_index_expression: ($) =>
      seq(
        field('table', $._prefix_expression),
        '.',
        field('field', $.identifier)
      ),

    function_call: ($) =>
      seq(
        field('name', choice($._prefix_expression, $.method_index_expression)),
        field('arguments', $.arguments)
      ),
    method_index_expression: ($) =>
      seq(
        field('table', $._prefix_expression),
        ':',
        field('method', $.identifier)
      ),
    arguments: ($) =>
      choice(
        seq('(', optional(list_seq($.expression, ',')), ')'),
        $.table_constructor,
        $.string
      ),

    parenthesized_expression: ($) => seq('(', $.expression, ')'),

    table_constructor: ($) => seq('{', optional($._field_list), '}'),
    _field_list: ($) => list_seq($.field, $._field_sep, true),
    _field_sep: (_) => choice(',', ';'),
    field: ($) =>
      choice(
        seq(
          '[',
          field('name', $.expression),
          ']',
          field('operator', '='),
          field('value', $.expression)
        ),
        seq(field('name', $.identifier), '=', field('value', $.expression)),
        field('value', $.expression)
      ),

    // Pico-8 binary operators (Lua + bitwise + integer division `\`,
    // `!=` alias for `~=`, and Pico-8-specific bit ops).
    binary_expression: ($) =>
      choice(
        ...[
          ['or', PREC.OR],
          ['and', PREC.AND],
          ['<', PREC.COMPARE],
          ['<=', PREC.COMPARE],
          ['==', PREC.COMPARE],
          ['~=', PREC.COMPARE],
          ['!=', PREC.COMPARE],
          ['>=', PREC.COMPARE],
          ['>', PREC.COMPARE],
          ['|', PREC.BIT_OR],
          ['^^', PREC.BIT_OR],
          ['<<>', PREC.BIT_OR],
          ['>><', PREC.BIT_OR],
          ['~', PREC.BIT_NOT],
          ['&', PREC.BIT_AND],
          ['<<', PREC.BIT_SHIFT],
          ['>>', PREC.BIT_SHIFT],
          ['>>>', PREC.BIT_SHIFT],
          ['+', PREC.PLUS],
          ['-', PREC.PLUS],
          ['*', PREC.MULTI],
          ['/', PREC.MULTI],
          ['//', PREC.MULTI],
          ['\\', PREC.MULTI],
          ['%', PREC.MULTI],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field('left', $.expression),
              field('operator', operator),
              field('right', $.expression)
            )
          )
        ),
        ...[
          ['..', PREC.CONCAT],
          ['^', PREC.POWER],
        ].map(([operator, precedence]) =>
          prec.right(
            precedence,
            seq(
              field('left', $.expression),
              field('operator', operator),
              field('right', $.expression)
            )
          )
        )
      ),

    // Unary operators include Pico-8 `@` (peek), `%` (peek2), `$` (peek4).
    unary_expression: ($) =>
      prec.left(
        PREC.UNARY,
        seq(
          field('operator', choice('not', '#', '-', '~', '@', '%', '$')),
          field('operand', $.expression)
        )
      ),

    // Identifiers: same broad regex as the Lua grammar, which already
    // accepts Unicode glyphs such as 🅾️ and ❎ used by Pico-8 carts.
    identifier: (_) => {
      const identifier_start =
        /[^\p{Control}\s+\-*/%^#&~|<>=(){}\[\];:,.\\'"?@$!\d]/u;
      const identifier_continue =
        /[^\p{Control}\s+\-*/%^#&~|<>=(){}\[\];:,.\\'"?@$!]*/u;
      return token(seq(identifier_start, identifier_continue));
    },

    // Comments: Lua `--` line comments, Pico-8 `//` line comments,
    // and basic `--[[ ... ]]` block comments. Block form is matched as
    // a single token since `comment` is consumed as an `extras` rule.
    comment: (_) =>
      token(
        choice(
          seq('//', /[^\r\n]*/),
          seq('--[[', /([^\]]|\][^\]])*/, ']]'),
          seq('--', /[^\r\n]*/)
        )
      ),
  },
});
