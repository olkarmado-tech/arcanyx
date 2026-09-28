const { createRunOncePlugin, withAppBuildGradle, withMainApplication, withStringsXml } = require("@expo/config-plugins");

const SDK = "io.appmetrica.analytics:analytics:8.5.1";

function apiKeyFrom(config) {
  return (config.extra?.appmetrica?.apiKey || "").toString().trim();
}

function withAppMetricaDependency(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;
    if (cfg.modResults.contents.includes("io.appmetrica.analytics:analytics")) return cfg;
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /dependencies\s*\{/,
      (line) => `${line}\n    implementation("${SDK}")`,
    );
    return cfg;
  });
}

function withAppMetricaKey(config) {
  const apiKey = apiKeyFrom(config);
  if (!apiKey) return config;
  return withStringsXml(config, (cfg) => {
    const strings = cfg.modResults.resources.string ?? [];
    const existing = strings.find((item) => item.$.name === "appmetrica_api_key");
    if (existing) existing._ = apiKey;
    else strings.push({ $: { name: "appmetrica_api_key", translatable: "false" }, _: apiKey });
    cfg.modResults.resources.string = strings;
    return cfg;
  });
}

const ACTIVATE = `
  private fun activateAppMetrica() {
    val appMetricaKey = getString(R.string.appmetrica_api_key)
    if (appMetricaKey.isBlank()) return
    val appMetricaConfig =
      io.appmetrica.analytics.AppMetricaConfig.newConfigBuilder(appMetricaKey).build()
    io.appmetrica.analytics.AppMetrica.activate(this, appMetricaConfig)
    io.appmetrica.analytics.AppMetrica.enableActivityAutoTracking(this)
  }
`;

function withAppMetricaInit(config) {
  if (!apiKeyFrom(config)) return config;
  return withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== "kt") return cfg;
    if (cfg.modResults.contents.includes("activateAppMetrica")) return cfg;
    if (!cfg.modResults.contents.includes("super.onCreate()")) return cfg;
    let contents = cfg.modResults.contents.replace(
      "super.onCreate()",
      "super.onCreate()\n    activateAppMetrica()",
    );
    const end = contents.lastIndexOf("}");
    contents = `${contents.slice(0, end)}${ACTIVATE}\n${contents.slice(end)}`;
    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withAppMetrica(config) {
  config = withAppMetricaDependency(config);
  config = withAppMetricaKey(config);
  config = withAppMetricaInit(config);
  return config;
}

module.exports = createRunOncePlugin(withAppMetrica, "with-appmetrica", "1.0.0");
