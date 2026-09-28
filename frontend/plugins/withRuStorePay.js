const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withMainActivity,
  withMainApplication,
  withProjectBuildGradle,
  withStringsXml,
} = require("@expo/config-plugins");

const PAY_SDK = "ru.rustore.sdk-wrapper.react-native:pay:11.0.0";
const PAY_CLIENT = "ru.rustore.sdk:pay:11.0.0";
const MAVEN = "https://nexus-external.vkteam.ru/repository/maven-rustore-exposed/";

function rustoreExtra(config) {
  return config.extra?.rustore ?? {};
}

function withRuStoreMaven(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;
    if (cfg.modResults.contents.includes("nexus-external.vkteam.ru")) return cfg;
    const repo = `maven { url '${MAVEN}' }`;
    if (cfg.modResults.contents.includes("jitpack.io")) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /maven\s*\{\s*url\s*['"]https:\/\/www\.jitpack\.io['"]\s*\}/,
        (line) => `${line}\n    ${repo}`,
      );
      return cfg;
    }
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /repositories\s*\{/,
      (line) => `${line}\n    ${repo}`,
    );
    return cfg;
  });
}

function withRuStoreDependency(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;
    let contents = cfg.modResults.contents;
    if (!contents.includes("sdk-wrapper.react-native:pay")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        (line) => `${line}\n    implementation("${PAY_SDK}")`,
      );
    }
    if (!contents.includes("ru.rustore.sdk:pay")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        (line) => `${line}\n    implementation("${PAY_CLIENT}")`,
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withRuStorePackage(config) {
  return withMainApplication(config, (cfg) => {
    if (cfg.modResults.contents.includes("RuStoreReactPayPackage")) return cfg;
    const registration = "add(ru.rustore.react.pay.RuStoreReactPayPackage())";
    if (cfg.modResults.contents.includes("// add(MyReactNativePackage())")) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        "// add(MyReactNativePackage())",
        registration,
      );
      return cfg;
    }
    cfg.modResults.contents = cfg.modResults.contents.replace(
      "PackageList(this).packages.apply {",
      `PackageList(this).packages.apply {\n          ${registration}`,
    );
    return cfg;
  });
}

function ensureMeta(application, name, value) {
  if (!application["meta-data"]) application["meta-data"] = [];
  const existing = application["meta-data"].find((item) => item.$["android:name"] === name);
  if (existing) {
    existing.$["android:value"] = value;
    return;
  }
  application["meta-data"].push({
    $: { "android:name": name, "android:value": value },
  });
}

function withRuStoreManifest(config) {
  const { consoleApplicationId, payScheme } = rustoreExtra(config);
  const scheme = (payScheme || config.scheme || "frontend").toString();
  const appId = (consoleApplicationId || "").toString().trim();

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    activity.$["android:launchMode"] = "singleTop";

    const filters = activity["intent-filter"] ?? [];
    const hasScheme = filters.some((filter) =>
      (filter.data ?? []).some((data) => data.$?.["android:scheme"] === scheme),
    );
    if (!hasScheme) {
      filters.push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
          { $: { "android:name": "android.intent.category.BROWSABLE" } },
        ],
        data: [{ $: { "android:scheme": scheme } }],
      });
      activity["intent-filter"] = filters;
    }

    if (appId) {
      ensureMeta(application, "console_app_id_value", "@string/CONSOLE_APPLICATION_ID");
      ensureMeta(application, "sdk_pay_scheme_value", scheme);
    }
    return cfg;
  });
}

function withRuStoreStrings(config) {
  const appId = (rustoreExtra(config).consoleApplicationId || "").toString().trim();
  if (!appId) return config;
  return withStringsXml(config, (cfg) => {
    const strings = cfg.modResults.resources.string ?? [];
    const existing = strings.find((item) => item.$.name === "CONSOLE_APPLICATION_ID");
    if (existing) existing._ = appId;
    else strings.push({ $: { name: "CONSOLE_APPLICATION_ID" }, _: appId });
    cfg.modResults.resources.string = strings;
    return cfg;
  });
}

const INTENT_HELPER = `
  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    proceedRuStorePayIntent(intent)
  }

  private fun proceedRuStorePayIntent(intent: android.content.Intent?) {
    if (intent == null) return
    try {
      ru.rustore.sdk.pay.RuStorePayClient.instance
        .getIntentInteractor()
        .proceedIntent(intent, sdkTheme = ru.rustore.sdk.pay.model.SdkTheme.DARK)
    } catch (error: Throwable) {
    }
  }
`;

function withRuStoreIntent(config) {
  const appId = (rustoreExtra(config).consoleApplicationId || "").toString().trim();
  if (!appId) return config;
  return withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== "kt") return cfg;
    let contents = cfg.modResults.contents;
    if (!contents.includes("proceedRuStorePayIntent(intent)")) {
      contents = contents.replace(
        "super.onCreate(null)",
        `super.onCreate(null)
    if (savedInstanceState == null) {
      proceedRuStorePayIntent(intent)
    }`,
      );
    }
    if (!contents.includes("private fun proceedRuStorePayIntent")) {
      contents = contents.replace(
        "override fun invokeDefaultOnBackPressed()",
        `${INTENT_HELPER}\n  override fun invokeDefaultOnBackPressed()`,
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withRuStorePay(config) {
  config = withRuStoreMaven(config);
  config = withRuStoreDependency(config);
  config = withRuStorePackage(config);
  config = withRuStoreManifest(config);
  config = withRuStoreStrings(config);
  config = withRuStoreIntent(config);
  return config;
}

module.exports = createRunOncePlugin(withRuStorePay, "with-rustore-pay", "1.0.0");
