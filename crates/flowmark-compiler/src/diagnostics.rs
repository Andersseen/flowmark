/// Severity level of a compilation diagnostic.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagnosticSeverity {
    Error,
    Warning,
}

/// A single compilation diagnostic.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub message: String,
    pub severity: DiagnosticSeverity,
    pub code: Option<String>,
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
            severity: DiagnosticSeverity::Error,
            code: None,
            line,
            column,
            start,
            end,
        }
    }

    pub fn with_severity(mut self, severity: DiagnosticSeverity) -> Self {
        self.severity = severity;
        self
    }

    pub fn with_code(mut self, code: impl Into<String>) -> Self {
        self.code = Some(code.into());
        self
    }
}
