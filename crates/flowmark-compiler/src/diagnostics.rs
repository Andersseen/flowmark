/// A single compilation diagnostic.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub message: String,
    pub line: usize,
    pub column: usize,
    pub start: usize,
    pub end: usize,
}

impl Diagnostic {
    pub fn new(
        message: impl Into<String>,
        line: usize,
        column: usize,
        start: usize,
        end: usize,
    ) -> Self {
        Self {
            message: message.into(),
            line,
            column,
            start,
            end,
        }
    }
}
