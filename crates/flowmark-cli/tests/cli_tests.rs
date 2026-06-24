use assert_cmd::Command;
use std::str;

#[test]
fn cli_compiles_valid_template() {
    let mut cmd = Command::cargo_bin("flowmark").unwrap();
    cmd.arg("compile")
        .arg("-")
        .arg("--runtime")
        .arg("@flowmark/runtime")
        .write_stdin("<h1>{{ context.title }}</h1>");
    let output = cmd.output().unwrap();
    let stdout = str::from_utf8(&output.stdout).unwrap();
    assert!(stdout.contains("renderValue(context.title)"));
}

#[test]
fn cli_reports_human_errors_by_default() {
    let mut cmd = Command::cargo_bin("flowmark").unwrap();
    cmd.arg("compile").arg("-").write_stdin("{{ context. }}");
    let output = cmd.output().unwrap();
    assert!(!output.status.success());
    let stderr = str::from_utf8(&output.stderr).unwrap();
    assert!(stderr.contains("error"));
    assert!(stderr.contains("FM0011"));
}

#[test]
fn cli_reports_json_errors_when_asked() {
    let mut cmd = Command::cargo_bin("flowmark").unwrap();
    cmd.arg("compile")
        .arg("-")
        .arg("--diagnostic-format")
        .arg("json")
        .write_stdin("{{ context. }}");
    let output = cmd.output().unwrap();
    assert!(!output.status.success());
    let stderr = str::from_utf8(&output.stderr).unwrap();
    assert!(stderr.contains("\"diagnostics\""));
    assert!(stderr.contains("FM0011"));
}

#[test]
fn cli_respects_version_flag() {
    let mut cmd = Command::cargo_bin("flowmark").unwrap();
    cmd.arg("--version");
    let output = cmd.output().unwrap();
    let stdout = str::from_utf8(&output.stdout).unwrap();
    assert!(stdout.contains("flowmark"));
}
