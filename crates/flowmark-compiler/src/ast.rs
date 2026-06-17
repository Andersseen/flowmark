/// Byte range inside the source template.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

/// The root of a parsed template.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootNode {
    pub children: Vec<Node>,
}

/// Any node that can appear as a child of the root or inside a block.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Node {
    Text(TextNode),
    Interpolation(InterpolationNode),
    IfBlock(IfBlockNode),
    ForBlock(ForBlockNode),
    SwitchBlock(SwitchBlockNode),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextNode {
    pub value: String,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InterpolationNode {
    pub expression: String,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IfBlockNode {
    pub branches: Vec<IfBranch>,
    pub else_branch: Option<Vec<Node>>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IfBranch {
    pub condition: String,
    pub children: Vec<Node>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ForBlockNode {
    pub item: String,
    pub iterable: String,
    pub track: String,
    pub children: Vec<Node>,
    pub empty: Option<Vec<Node>>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SwitchBlockNode {
    pub expression: String,
    pub cases: Vec<SwitchCaseNode>,
    pub default: Option<Vec<Node>>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SwitchCaseNode {
    pub expression: String,
    pub children: Vec<Node>,
    pub span: Span,
}
