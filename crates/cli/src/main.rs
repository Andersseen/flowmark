use std::{env, fs, process};

fn main() {
    let mut args = env::args();
    let program = args
        .next()
        .unwrap_or_else(|| "flowmark".to_owned());

    let Some(path) = args.next() else {
        eprintln!("Usage: {program} <template-file>");
        process::exit(1);
    };

    if args.next().is_some() {
        eprintln!("Usage: {program} <template-file>");
        process::exit(1);
    }

    let source = match fs::read_to_string(&path) {
        Ok(source) => source,
        Err(error) => {
            eprintln!("Failed to read {path}: {error}");
            process::exit(1);
        }
    };

    match flowmark::compile(&source) {
        Ok(output) => {
            print!("{}", output.code);
        }
        Err(diagnostics) => {
            for diagnostic in diagnostics {
                eprintln!(
                    "{}:{}:{}: {}",
                    path, diagnostic.line, diagnostic.column, diagnostic.message
                );
            }
            process::exit(1);
        }
    }
}
