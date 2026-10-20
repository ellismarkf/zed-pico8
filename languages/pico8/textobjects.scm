(function_declaration
  body: (_)? @function.inside) @function.around

(function_definition
  body: (_)? @function.inside) @function.around

(table_constructor) @class.around

(comment)+ @comment.around
