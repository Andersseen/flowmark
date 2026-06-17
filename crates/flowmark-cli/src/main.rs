use clap::{Parser, Subcommand};
use flowmark_compiler::{compile, CompileOptions, DiagnosticSeverity};
use std::{fs, path::Path, process};

#[derive(Parser)]
#[command(name = "flowmark")]
#[command(about = "Compile Flowmark templates to JavaScript render functions")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Compile a Flowmark template file
    Compile {
        /// Path to the .flow template file
        input: String,

        /// Output file path
        #[arg(long)]
        out: Option<String>,

        /// Runtime module import path
        #[arg(long, default_value = "@flowmark/runtime")]
        runtime: String,
    },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Command::Compile {
            input,
            out,
            runtime,
        } => compile_file(&input, out.as_deref(), &runtime),
    }
}

fn compile_file(input: &str, out: Option<&str>, runtime: &str) {
    let path = Path::new(input);

    if path.extension().and_then(|ext| ext.to_str()) != Some("flow") {
        eprintln!("{}: expected a .flow file", input);
        process::exit(1);
    }

    let source = match fs::read_to_string(path) {
        Ok(source) => source,
        Err(error) => {
            eprintln!("Failed to read {}: {}", input, error);
            process::exit(1);
        }
    };

    let options = CompileOptions::new(runtime).with_filename(input);

    match compile(&source, options) {
        Ok(output) => {
            if let Some(out_path) = out {
                if let Err(error) = fs::write(out_path, output.code) {
                    eprintln!("Failed to write {}: {}", out_path, error);
                    process::exit(1);
                }
            } else {
                print!("{}", output.code);
            }
        }
        Err(diagnostics) => {
            for diagnostic in diagnostics {
                let severity = match diagnostic.severity {
                    DiagnosticSeverity::Error => "error",
                    DiagnosticSeverity::Warning => "warning",
                };
                let code = diagnostic
                    .code
                    .as_ref()
                    .map(|c| format!("[{}] ", c))
                    .unwrap_or_default();
                eprintln!(
                    "{}:{}:{}: {}{}: {}",
                    input, diagnostic.line, diagnostic.column, severity, code, diagnostic.message
                );
            }
            process::exit(1);
        }
    }
}
