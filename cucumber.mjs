export default function () {
  return {
    default: {
      paths: ["./features/**/*.feature"],
      import: ["./support/**/*.ts", "./steps/**/*.ts"],
      format: ["progress", "json:results/cucumber.json"],
      publishQuiet: true,
    },
    report: {
      paths: ["./features/**/*.feature"],
      import: ["./support/**/*.ts", "./steps/**/*.ts"],
      format: [
        "progress",
        "json:results/cucumber.json",
        "html:results/cucumber.html",
        "junit:results/cucumber.xml",
        "message:results/cucumber.ndjson",
      ],
      publishQuiet: true,
    },
    debug: {
      paths: ["./features/**/*.feature"],
      import: ["./support/**/*.ts", "./steps/**/*.ts"],
      format: ["progress-bar", "json:results/cucumber-debug.json"],
      publishQuiet: true,
      worldParameters: {
        trace: true,
      },
    },
  };
}
