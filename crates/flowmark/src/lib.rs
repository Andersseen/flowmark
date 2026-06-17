pub mod ast;
pub mod codegen;
pub mod diagnostics;
pub mod parser;

pub use diagnostics::Diagnostic;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompileOutput {
    pub code: String,
}

pub fn compile(source: &str) -> Result<CompileOutput, Vec<Diagnostic>> {
    let template = parser::parse(source)?;
    let code = codegen::generate(&template);

    Ok(CompileOutput { code })
}
