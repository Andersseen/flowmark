use crate::{ast::Template, diagnostics::Diagnostic};

pub fn parse(source: &str) -> Result<Template, Vec<Diagnostic>> {
    Ok(Template {
        source: source.to_owned(),
    })
}
