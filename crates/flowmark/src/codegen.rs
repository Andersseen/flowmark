use crate::ast::Template;

pub fn generate(_template: &Template) -> String {
    [
        "export function render(ctx = {}) {",
        "  void ctx;",
        "  return \"\";",
        "}",
        "",
    ]
    .join("\n")
}
