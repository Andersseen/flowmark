use crate::{ast::*, cursor::Cursor, diagnostics::Diagnostic};

const IF_START: &str = "@if";
const ELSE_IF_START: &str = "@else if";
const ELSE_START: &str = "@else";
const FOR_START: &str = "@for";
const EMPTY_START: &str = "@empty";
const SWITCH_START: &str = "@switch";
const CASE_START: &str = "@case";
const DEFAULT_START: &str = "@default";

/// Parse a full template source into a root node.
pub fn parse(source: &str) -> Result<RootNode, Vec<Diagnostic>> {
    let mut cursor = Cursor::new(source);
    let children = parse_nodes(&mut cursor, &[])?;

    if cursor.is_eof() {
        Ok(RootNode { children })
    } else {
        Err(vec![Diagnostic::new(
            "Unexpected token",
            cursor.line(),
            cursor.column(),
            cursor.position(),
            cursor.position() + 1,
        )])
    }
}

/// Parse a sequence of child nodes until one of the terminator markers is found
/// or the end of the source is reached.
fn parse_nodes(cursor: &mut Cursor, terminators: &[&str]) -> Result<Vec<Node>, Vec<Diagnostic>> {
    let mut nodes = Vec::new();
    let mut diagnostics = Vec::new();

    loop {
        skip_insignificant_whitespace(cursor);

        if cursor.is_eof() {
            break;
        }

        if cursor.starts_with("}") {
            if terminators.contains(&"}") {
                break;
            }
            let start = cursor.position();
            cursor.advance();
            diagnostics.push(Diagnostic::new(
                "Unexpected '}'",
                cursor.line(),
                cursor.column(),
                start,
                cursor.position(),
            ));
            continue;
        }

        if cursor.starts_with("{{") {
            match parse_interpolation(cursor) {
                Ok(node) => nodes.push(Node::Interpolation(node)),
                Err(err) => diagnostics.extend(err),
            }
            continue;
        }

        if cursor.starts_with(IF_START) {
            match parse_if_block(cursor) {
                Ok(node) => nodes.push(Node::IfBlock(node)),
                Err(err) => diagnostics.extend(err),
            }
            continue;
        }

        if cursor.starts_with(FOR_START) {
            match parse_for_block(cursor) {
                Ok(node) => nodes.push(Node::ForBlock(node)),
                Err(err) => diagnostics.extend(err),
            }
            continue;
        }

        if cursor.starts_with(SWITCH_START) {
            match parse_switch_block(cursor) {
                Ok(node) => nodes.push(Node::SwitchBlock(node)),
                Err(err) => diagnostics.extend(err),
            }
            continue;
        }

        if let Some(_terminator) = match_terminator(cursor, terminators) {
            break;
        }

        if let Some(keyword) = match_unexpected_keyword(cursor) {
            let start = cursor.position();
            cursor.advance_by(keyword.len());
            diagnostics.push(Diagnostic::new(
                format!("Unexpected '{}'", keyword),
                cursor.line(),
                cursor.column(),
                start,
                cursor.position(),
            ));
            continue;
        }

        match parse_text(cursor) {
            Ok(node) => {
                if !node.value.is_empty() {
                    nodes.push(Node::Text(node));
                }
            }
            Err(err) => diagnostics.extend(err),
        }
    }

    if !diagnostics.is_empty() {
        return Err(diagnostics);
    }

    Ok(nodes)
}

fn match_terminator<'a>(cursor: &Cursor, terminators: &[&'a str]) -> Option<&'a str> {
    terminators
        .iter()
        .copied()
        .find(|terminator| cursor.starts_with(terminator))
}

fn match_unexpected_keyword(cursor: &Cursor) -> Option<&'static str> {
    let keywords = [
        ELSE_IF_START,
        ELSE_START,
        EMPTY_START,
        CASE_START,
        DEFAULT_START,
    ];
    keywords
        .iter()
        .copied()
        .find(|keyword| cursor.starts_with(keyword))
}

fn parse_interpolation(cursor: &mut Cursor) -> Result<InterpolationNode, Vec<Diagnostic>> {
    let start = cursor.position();
    cursor.advance_by(2); // skip {{

    let expression_start = cursor.position();
    while !cursor.is_eof() && !cursor.starts_with("}}") {
        cursor.advance();
    }

    if cursor.is_eof() {
        return Err(vec![Diagnostic::new(
            "Unclosed interpolation",
            cursor.line(),
            cursor.column(),
            start,
            cursor.position(),
        )]);
    }

    let expression = cursor
        .slice(expression_start, cursor.position())
        .trim()
        .to_owned();
    cursor.advance_by(2); // skip }}
    let end = cursor.position();

    Ok(InterpolationNode {
        expression,
        span: Span { start, end },
    })
}

fn parse_text(cursor: &mut Cursor) -> Result<TextNode, Vec<Diagnostic>> {
    let start = cursor.position();
    let mut value = String::new();

    loop {
        if cursor.is_eof() {
            break;
        }

        if cursor.starts_with("{{")
            || cursor.starts_with("}")
            || cursor.starts_with(IF_START)
            || cursor.starts_with(FOR_START)
            || cursor.starts_with(SWITCH_START)
            || cursor.starts_with(ELSE_IF_START)
            || cursor.starts_with(ELSE_START)
            || cursor.starts_with(EMPTY_START)
            || cursor.starts_with(CASE_START)
            || cursor.starts_with(DEFAULT_START)
        {
            break;
        }

        value.push(cursor.advance().unwrap());
    }

    Ok(TextNode {
        value,
        span: Span {
            start,
            end: cursor.position(),
        },
    })
}

fn parse_if_block(cursor: &mut Cursor) -> Result<IfBlockNode, Vec<Diagnostic>> {
    let start = cursor.position();
    cursor.advance_by(IF_START.len());

    let condition = parse_parenthesized_expression(cursor)?;
    expect_block_open(cursor)?;

    let first_branch_children = parse_nodes(cursor, &[ELSE_IF_START, ELSE_START, "}"])?;
    let mut branches = vec![IfBranch {
        condition,
        children: first_branch_children,
        span: Span {
            start,
            end: cursor.position(),
        },
    }];

    let mut else_branch: Option<Vec<Node>> = None;
    let mut closed = false;

    loop {
        skip_whitespace(cursor);

        if cursor.starts_with(ELSE_IF_START) {
            cursor.advance_by(ELSE_IF_START.len());
            let condition = parse_parenthesized_expression(cursor)?;
            expect_block_open(cursor)?;
            let children = parse_nodes(cursor, &[ELSE_IF_START, ELSE_START, "}"])?;
            branches.push(IfBranch {
                condition,
                children,
                span: Span {
                    start,
                    end: cursor.position(),
                },
            });
            continue;
        }

        if cursor.starts_with(ELSE_START) {
            cursor.advance_by(ELSE_START.len());
            expect_block_open(cursor)?;
            else_branch = Some(parse_nodes(cursor, &["}"])?);
            expect_block_close(cursor)?;
            closed = true;
            break;
        }

        if cursor.starts_with("}") {
            expect_block_close(cursor)?;
            skip_whitespace(cursor);

            if cursor.starts_with(ELSE_IF_START) || cursor.starts_with(ELSE_START) {
                continue;
            }

            closed = true;
            break;
        }

        break;
    }

    if !closed {
        expect_block_close(cursor)?;
    }

    let end = cursor.position();

    Ok(IfBlockNode {
        branches,
        else_branch,
        span: Span { start, end },
    })
}

fn parse_for_block(cursor: &mut Cursor) -> Result<ForBlockNode, Vec<Diagnostic>> {
    let start = cursor.position();
    cursor.advance_by(FOR_START.len());

    let header = parse_parenthesized_expression(cursor)?;
    let (item, iterable, track) = parse_for_header(&header, start, cursor)?;

    expect_block_open(cursor)?;
    let children = parse_nodes(cursor, &[EMPTY_START, "}"])?;

    skip_whitespace(cursor);

    let empty = if cursor.starts_with(EMPTY_START) {
        cursor.advance_by(EMPTY_START.len());
        expect_block_open(cursor)?;
        let empty_children = parse_nodes(cursor, &["}"])?;
        expect_block_close(cursor)?;
        Some(empty_children)
    } else {
        expect_block_close(cursor)?;
        skip_whitespace(cursor);

        if cursor.starts_with(EMPTY_START) {
            cursor.advance_by(EMPTY_START.len());
            expect_block_open(cursor)?;
            let empty_children = parse_nodes(cursor, &["}"])?;
            expect_block_close(cursor)?;
            Some(empty_children)
        } else {
            None
        }
    };

    let end = cursor.position();

    Ok(ForBlockNode {
        item,
        iterable,
        track,
        children,
        empty,
        span: Span { start, end },
    })
}

fn parse_for_header(
    header: &str,
    start: usize,
    cursor: &Cursor,
) -> Result<(String, String, String), Vec<Diagnostic>> {
    let trimmed = header.trim();

    let (for_part, track_part) = match trimmed.rfind(';') {
        Some(index) => (&trimmed[..index], &trimmed[index + 1..]),
        None => {
            return Err(vec![Diagnostic::new(
                "Missing 'track' expression in @for",
                cursor.line(),
                cursor.column(),
                start,
                cursor.position(),
            )]);
        }
    };

    let track_trimmed = track_part.trim();
    if !track_trimmed.starts_with("track ") {
        return Err(vec![Diagnostic::new(
            "Invalid @for syntax: expected 'track <expression>'",
            cursor.line(),
            cursor.column(),
            start,
            cursor.position(),
        )]);
    }
    let track = track_trimmed["track ".len()..].trim().to_owned();

    let for_trimmed = for_part.trim();
    let of_index = match for_trimmed.find(" of ") {
        Some(index) => index,
        None => {
            return Err(vec![Diagnostic::new(
                "Invalid @for syntax: expected '<item> of <iterable>'",
                cursor.line(),
                cursor.column(),
                start,
                cursor.position(),
            )]);
        }
    };

    let item = for_trimmed[..of_index].trim().to_owned();
    let iterable = for_trimmed[of_index + 3..].trim().to_owned();

    if item.is_empty() || iterable.is_empty() {
        return Err(vec![Diagnostic::new(
            "Invalid @for syntax: expected '<item> of <iterable>'",
            cursor.line(),
            cursor.column(),
            start,
            cursor.position(),
        )]);
    }

    Ok((item, iterable, track))
}

fn parse_switch_block(cursor: &mut Cursor) -> Result<SwitchBlockNode, Vec<Diagnostic>> {
    let start = cursor.position();
    cursor.advance_by(SWITCH_START.len());

    let expression = parse_parenthesized_expression(cursor)?;
    expect_block_open(cursor)?;

    let mut cases = Vec::new();
    let mut default: Option<Vec<Node>> = None;

    loop {
        skip_whitespace(cursor);

        if cursor.starts_with(CASE_START) {
            cursor.advance_by(CASE_START.len());
            let case_expression = parse_parenthesized_expression(cursor)?;
            expect_block_open(cursor)?;
            let children = parse_nodes(cursor, &[CASE_START, DEFAULT_START, "}"])?;
            expect_block_close(cursor)?;
            cases.push(SwitchCaseNode {
                expression: case_expression,
                children,
                span: Span {
                    start,
                    end: cursor.position(),
                },
            });
            continue;
        }

        if cursor.starts_with(DEFAULT_START) {
            cursor.advance_by(DEFAULT_START.len());
            expect_block_open(cursor)?;
            default = Some(parse_nodes(cursor, &[CASE_START, DEFAULT_START, "}"])?);
            expect_block_close(cursor)?;
            break;
        }

        if cursor.starts_with("}") {
            break;
        }

        break;
    }

    expect_block_close(cursor)?;
    let end = cursor.position();

    Ok(SwitchBlockNode {
        expression,
        cases,
        default,
        span: Span { start, end },
    })
}

fn parse_parenthesized_expression(cursor: &mut Cursor) -> Result<String, Vec<Diagnostic>> {
    skip_whitespace(cursor);
    let start = cursor.position();

    if !cursor.starts_with("(") {
        return Err(vec![Diagnostic::new(
            "Expected '('",
            cursor.line(),
            cursor.column(),
            start,
            cursor.position(),
        )]);
    }

    cursor.advance(); // skip (
    let expression_start = cursor.position();
    let mut depth = 1;

    while !cursor.is_eof() && depth > 0 {
        let ch = cursor.current().unwrap();

        if ch == '\'' || ch == '"' {
            cursor.advance();
            while let Some(inner) = cursor.current() {
                cursor.advance();
                if inner == ch {
                    break;
                }
            }
            continue;
        }

        match ch {
            '(' => depth += 1,
            ')' => depth -= 1,
            _ => {}
        }

        cursor.advance();
    }

    if depth != 0 {
        return Err(vec![Diagnostic::new(
            "Unclosed expression",
            cursor.line(),
            cursor.column(),
            start,
            cursor.position(),
        )]);
    }

    let expression = cursor
        .slice(expression_start, cursor.position() - 1)
        .trim()
        .to_owned();

    Ok(expression)
}

fn expect_block_open(cursor: &mut Cursor) -> Result<(), Vec<Diagnostic>> {
    skip_whitespace(cursor);
    let start = cursor.position();

    if cursor.starts_with("{") {
        cursor.advance();
        Ok(())
    } else {
        Err(vec![Diagnostic::new(
            "Expected '{'",
            cursor.line(),
            cursor.column(),
            start,
            cursor.position(),
        )])
    }
}

fn expect_block_close(cursor: &mut Cursor) -> Result<(), Vec<Diagnostic>> {
    skip_whitespace(cursor);
    let start = cursor.position();

    if cursor.starts_with("}") {
        cursor.advance();
        Ok(())
    } else {
        Err(vec![Diagnostic::new(
            "Expected '}'",
            cursor.line(),
            cursor.column(),
            start,
            cursor.position(),
        )])
    }
}

fn skip_whitespace(cursor: &mut Cursor) {
    while let Some(ch) = cursor.current() {
        if ch.is_whitespace() {
            cursor.advance();
        } else {
            break;
        }
    }
}

fn skip_insignificant_whitespace(_cursor: &mut Cursor) {
    // Leading whitespace before a control-flow marker is not meaningful text.
    // Text nodes still capture whitespace between elements and interpolations.
}
