const heroVideo = document.querySelector("#reboot-video");
const hero = document.querySelector(".hero");
const soundToggle = document.querySelector("#sound-toggle");
const PHASE = ["A", "B", "C"].includes(window.SEEDANCE_PHASE) ? window.SEEDANCE_PHASE : "A";
const WAITLIST_ENDPOINT = window.SEEDANCE_WAITLIST_ENDPOINT?.trim() || "";
const PLAUSIBLE_SITE_ID = window.SEEDANCE_PLAUSIBLE_SITE_ID?.trim() || "";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sourceDocument = "https://bytedance.sg.larkoffice.com/docx/VKQ1d57DMoEMKhxU1IrlG8GUgAI";
const languageButtons = Array.from(document.querySelectorAll("[data-lang]"));
const languageMenu = document.querySelector(".language-menu");
const languageTrigger = document.querySelector("#language-trigger");
const languageOptions = document.querySelector("#language-options");
const currentLanguageLabel = document.querySelector(".current-language");
const navLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
const translatableElements = Array.from(
  document.querySelectorAll("[data-i18n], [data-i18n-html], [data-i18n-placeholder]"),
);
const modelMatrix = document.querySelector(".model-matrix");
const modelMatrixZoneSelector = ".model-matrix-product, .model-value";
const originalContent = new Map(
  translatableElements.map((element) => [
    element,
    element.hasAttribute("data-i18n-placeholder")
      ? element.getAttribute("placeholder")
      : element.hasAttribute("data-i18n-html")
        ? element.innerHTML
        : element.textContent,
  ]),
);

const heroPointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
let heroParallaxFrame;

const resetHeroParallax = () => {
  cancelAnimationFrame(heroParallaxFrame);
  heroParallaxFrame = requestAnimationFrame(() => {
    heroVideo?.style.setProperty("--hero-parallax-x", "0px");
  });
};

const setModelMatrixHighlight = (zone) => {
  if (!modelMatrix || !zone) return;

  modelMatrix.classList.toggle(
    "is-highlight-mini",
    zone.matches(".model-matrix-product-mini, .model-value-mini"),
  );
};

const updateModelMatrixHighlight = (event) => {
  const zone = event.target.closest(modelMatrixZoneSelector);
  if (!zone || !modelMatrix?.contains(zone)) return;

  setModelMatrixHighlight(zone);
};

modelMatrix?.addEventListener("pointerover", updateModelMatrixHighlight);
modelMatrix?.addEventListener("mouseover", updateModelMatrixHighlight);

const updateHeroParallax = (event) => {
  if (!hero || !heroVideo) return;

  const heroRect = hero.getBoundingClientRect();
  const pointerPosition = (event.clientX - heroRect.left) / heroRect.width - 0.5;
  const offset = Math.max(-24, Math.min(24, pointerPosition * -48));

  cancelAnimationFrame(heroParallaxFrame);
  heroParallaxFrame = requestAnimationFrame(() => {
    heroVideo.style.setProperty("--hero-parallax-x", `${offset.toFixed(2)}px`);
  });
};

if (hero && heroVideo && heroPointerMedia.matches && !reduceMotion) {
  hero.addEventListener("pointermove", updateHeroParallax);
  hero.addEventListener("pointerleave", resetHeroParallax);
  hero.addEventListener("pointercancel", resetHeroParallax);
}

const supportsNavRefraction = (() => {
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|CriOS/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const tester = document.createElement("div");

  tester.style.backdropFilter = "url(#nav-glass-refraction)";
  return !isSafari && !isFirefox && tester.style.backdropFilter.includes("url");
})();

document.documentElement.classList.toggle("supports-nav-refraction", supportsNavRefraction);

const navGlassSettings = {
  borderRadius: 50,
  borderWidth: 0.07,
  backgroundOpacity: 0.25,
  brightness: 50,
  opacity: 0.93,
  blur: 11,
  displace: 0.5,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20,
};

const navSurface = document.querySelector(".site-nav");
navSurface?.style.setProperty("--nav-background-opacity", navGlassSettings.backgroundOpacity);
const navGlassMap = document.querySelector("#nav-glass-map");
const navGlassBlur = document.querySelector("#nav-glass-blur");
const navDisplacementChannels = [
  [document.querySelector("#nav-red-displacement"), navGlassSettings.redOffset],
  [document.querySelector("#nav-green-displacement"), navGlassSettings.greenOffset],
  [document.querySelector("#nav-blue-displacement"), navGlassSettings.blueOffset],
];

const updateNavRefraction = () => {
  if (!supportsNavRefraction || !navSurface || !navGlassMap) return;

  const { width, height } = navSurface.getBoundingClientRect();
  const edgeSize = Math.min(width, height) * (navGlassSettings.borderWidth * 0.5);
  const mapWidth = Math.max(1, width - edgeSize * 2);
  const mapHeight = Math.max(1, height - edgeSize * 2);
  const distortionDensity = Math.min(1, Math.min(width, height) / 200);
  const mapSvg = `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nav-red-gradient" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000" />
          <stop offset="100%" stop-color="red" />
        </linearGradient>
        <linearGradient id="nav-blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000" />
          <stop offset="100%" stop-color="blue" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="black" />
      <rect width="${width}" height="${height}" rx="${navGlassSettings.borderRadius}" fill="url(#nav-red-gradient)" />
      <rect width="${width}" height="${height}" rx="${navGlassSettings.borderRadius}" fill="url(#nav-blue-gradient)" style="mix-blend-mode:difference" />
      <rect x="${edgeSize}" y="${edgeSize}" width="${mapWidth}" height="${mapHeight}" rx="${navGlassSettings.borderRadius}" fill="hsl(0 0% ${navGlassSettings.brightness}% / ${navGlassSettings.opacity})" style="filter:blur(${navGlassSettings.blur}px)" />
    </svg>`;

  navGlassMap.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(mapSvg)}`);
  navDisplacementChannels.forEach(([channel, offset]) => {
    channel?.setAttribute("scale", String((navGlassSettings.distortionScale + offset) * distortionDensity));
  });
  navGlassBlur?.setAttribute("stdDeviation", String(navGlassSettings.displace));
};

if (supportsNavRefraction && navSurface && "ResizeObserver" in window) {
  new ResizeObserver(updateNavRefraction).observe(navSurface);
}
requestAnimationFrame(updateNavRefraction);

const darkNavSurfaces = ".hero, .feature-dark, .workflow, .closing, .footer";
const navSurfaceSelectors = ".hero, .release-stats, .feature, .workflow, .industries, .models, .closing, .footer";
const navSections = navLinks
  .map((link) => [link, document.querySelector(link.getAttribute("href"))])
  .filter(([, section]) => section);

const updateNavContrast = () => {
  if (!navSurface) return;

  const navRect = navSurface.getBoundingClientRect();
  const samplePoints = [0.25, 0.5, 0.75].map((x) => [navRect.left + navRect.width * x, navRect.top + navRect.height / 2]);
  const surface = samplePoints
    .flatMap(([x, y]) => document.elementsFromPoint(x, y))
    .filter((element) => !navSurface.contains(element))
    .map((element) => element.closest(navSurfaceSelectors))
    .find(Boolean);

  navSurface.classList.toggle("is-over-dark", Boolean(surface?.matches(darkNavSurfaces)));
};

let navContrastFrame;
const scheduleNavContrast = () => {
  cancelAnimationFrame(navContrastFrame);
  navContrastFrame = requestAnimationFrame(updateNavContrast);
};

const updateActiveNavLink = () => {
  const sampleY = window.scrollY + window.innerHeight * 0.38;
  const activeEntry = navSections
    .filter(([, section]) => sampleY >= section.offsetTop)
    .at(-1);

  navLinks.forEach((link) => {
    const isActive = link === activeEntry?.[0];
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

let navActiveFrame;
const scheduleActiveNavLink = () => {
  cancelAnimationFrame(navActiveFrame);
  navActiveFrame = requestAnimationFrame(updateActiveNavLink);
};

window.addEventListener("scroll", scheduleNavContrast, { passive: true });
window.addEventListener("scroll", scheduleActiveNavLink, { passive: true });
window.addEventListener("resize", scheduleNavContrast);
window.addEventListener("resize", scheduleActiveNavLink);
scheduleNavContrast();
scheduleActiveNavLink();

const translations = {
  en: {
    skip: "Skip to content",
    navCapabilities: "Capabilities",
    navWorkflow: "Workflow",
    navIndustries: "Industries",
    navModels: "Models",
    navTry: "Try now",
    heroSubtitle: "Register early for priority access.",
    factDuration: "single generation",
    factAssets: "reference assets",
    factLanguagesValue: "Multilingual",
    factLanguages: "understanding & expression",
    explore: "Explore",
    casePlay: "Play case",
    caseNarrative: "EMOTION ROOM · 00:30",
    feature1Title: "30 seconds in one take.<br />A complete story, in one go.",
    feature1Body:
      "Generate up to 30 seconds at a time. Characters, scenes and shots stay coherent for commercials, short dramas and brand content.",
    feature1Point1: "Up to 30 seconds at a time",
    feature1Point2: "Stable characters and scenes across shots",
    feature1Point3: "High-fidelity continuation",
    caseReferences: "MULTIMODAL REFERENCES",
    feature2Title: "Up to 50 references.<br />Set the whole direction at once.",
    feature2Body:
      "Images, video, audio and text can guide one generation together. Characters, products, scenes, motion and sound no longer need to fit in one prompt.",
    feature2Point1: "50 multimodal references",
    feature2Point2: "Multiple subjects and scenes, in sync",
    feature2Point3: "More stable subjects and motion",
    editSelected: "Selected area",
    editCommand: "Replace only the glass. Keep the action and original lighting.",
    caseEditing: "LOCAL EDITING",
    feature3Title: "Change only what matters.<br />Keep the rest of the film.",
    feature3Body:
      "Replace objects, adjust motion and refine details while preserving the original composition, rhythm and texture.",
    feature3Point1: "Local replacement",
    feature3Point2: "Timing under control",
    feature3Point3: "Fewer revision cycles",
    caseLanguage: "MULTILINGUAL CREATION",
    feature4Title: "Multilingual creation.<br />Keep the idea intact across languages.",
    feature4Body:
      "Describe shots, performance and rhythm in the language you know best, with creative intent carried more precisely into the frame.",
    feature4Point1: "Stronger multilingual understanding and expression",
    feature4Point2: "Complex instruction understanding",
    feature4Point3: "Built for global teams",
    capabilitiesDisclaimer: "Final capabilities subject to official release.",
    workflowTitle: "Four steps from idea to delivery.",
    step1Title: "Write the idea",
    step1Body: "Write the story, camera and mood.",
    step2Title: "Add references",
    step2Body: "Add characters, products, scenes, motion and audio.",
    step3Title: "Generate the story",
    step3Body: "Choose duration and aspect ratio, then generate a complete sequence.",
    step4Title: "Refine precisely",
    step4Body: "Refine the frames that need it, then deliver.",
    industriesTitle: "More than advertising.<br /><em>Data for industry, too.</em>",
    industry1Tag: "Manufacturing / Retail",
    industry1Title: "Product video guides",
    industry1Body: "Turn product structure, operation and value into clear video content.",
    industry2Tag: "Embodied AI",
    industry2Title: "Synthetic robot training data",
    industry2Body: "Fill gaps in rare motion, scene and interaction data.",
    industry3Tag: "Autonomous Driving",
    industry3Title: "Synthetic edge-case data",
    industry3Body: "Generate hard-to-capture weather, road and incident scenarios to fill long-tail gaps.",
    modelsTitle: "Not every video<br />needs the same solution.",
    modelsIntro: "Choose quality and control for complex work, or cost and speed for production at scale.",
    model25Tag: "Quality and control first",
    modelMiniTag: "Cost and scale first",
    modelFit: "Best for",
    model25Fit: "Complex narratives, TVCs, short dramas and brand content",
    modelMiniFit: "Ecommerce, batch assets and rapid testing",
    modelNarrative: "Narrative",
    model25Narrative: "30-second stories with high-fidelity continuation",
    modelMiniNarrative: "Efficient short-form generation",
    modelControl: "References & editing",
    model25Control: "50 multimodal references, local editing and complex instructions",
    modelMiniControl: "Lightweight creation for frequent iteration",
    modelPriority: "Priority",
    model25Priority: "Quality, control and complete narrative",
    modelMiniPriority: "Cost, speed and scale",
    closingTitle: "From idea<br /><em>to final cut.</em>",
    notifyPrompt: "Not ready to register? Leave your email and we’ll notify you on launch day.",
    emailLabel: "Email",
    emailPlaceholder: "Your email",
    notifySubmit: "Notify me at launch",
    notifyInvalid: "Enter a valid email address.",
    notifySending: "Submitting…",
    notifySuccess: "You’re on the list. We’ll notify you at launch.",
    notifyFallback: "Your email app is opening. Send the prepared message to complete your request.",
    notifyError: "Couldn’t submit. Please try again or email cs@holycrab.ai.",
    footerAttribution:
      "Seedance is a model by ByteDance. HolyCrab provides access via a direct BytePlus agreement.",
  },
  ja: {
    skip: "本文へ移動",
    navCapabilities: "機能",
    navWorkflow: "使い方",
    navIndustries: "業界",
    navModels: "モデル",
    navTry: "試してみる",
    heroSubtitle: "事前登録で、優先体験。",
    factDuration: "1回で生成",
    factAssets: "参考素材",
    factLanguagesValue: "多言語",
    factLanguages: "理解と表現",
    explore: "詳しく見る",
    casePlay: "事例を再生",
    caseNarrative: "感情の部屋 · 00:30",
    feature1Title: "30秒を一度に。<br />物語を、最後まで。",
    feature1Body:
      "1回で最大30秒。人物、シーン、カメラのつながりを保ち、広告、ショートドラマ、ブランド映像に対応します。",
    feature1Point1: "1回で最大30秒",
    feature1Point2: "カット間で人物とシーンが安定",
    feature1Point3: "高精度な続き生成",
    caseReferences: "マルチモーダル参照",
    feature2Title: "最大50件の参考素材。<br />制作設定を、一度に伝える。",
    feature2Body:
      "画像、動画、音声、テキストを同時に参照。人物、商品、シーン、動き、音を一つのプロンプトに詰め込む必要はありません。",
    feature2Point1: "50件のマルチモーダル参照",
    feature2Point2: "複数人物・複数シーンを同期",
    feature2Point3: "主体と動きがより安定",
    editSelected: "選択範囲",
    editCommand: "グラスだけを変更。人物の動きと元の照明は維持。",
    caseEditing: "部分編集",
    feature3Title: "変えたい部分だけを編集。<br />映像全体はそのまま。",
    feature3Body:
      "構図、リズム、質感を保ちながら、対象物の置換、動きの調整、細部の修正ができます。",
    feature3Point1: "部分置換",
    feature3Point2: "時間軸を制御",
    feature3Point3: "修正を削減",
    caseLanguage: "多言語制作",
    feature4Title: "多言語で創作。<br />アイデアを翻訳で変えない。",
    feature4Body:
      "使い慣れた言葉でカメラ、演技、リズムを伝え、意図をより正確に映像へ反映します。",
    feature4Point1: "より強い多言語理解と表現",
    feature4Point2: "複雑な指示を理解",
    feature4Point3: "グローバルチーム向け",
    capabilitiesDisclaimer: "上記の機能は正式リリース時の内容に準じます。",
    workflowTitle: "アイデアから納品まで、4つのステップ。",
    step1Title: "アイデアを書く",
    step1Body: "物語、カメラ、感情を書く。",
    step2Title: "参考素材を追加",
    step2Body: "人物、商品、シーン、動き、音声を追加。",
    step3Title: "物語を生成",
    step3Body: "長さと画面比率を選び、完成したシーンを生成。",
    step4Title: "精密に仕上げる",
    step4Body: "必要な画面だけを修正して納品へ。",
    industriesTitle: "広告だけではない。<br /><em>産業データも生成する。</em>",
    industry1Tag: "製造 / 小売",
    industry1Title: "商品動画マニュアル",
    industry1Body: "商品の構造、操作、価値を分かりやすい動画に。",
    industry2Tag: "エンボディドAI",
    industry2Title: "ロボット学習データを合成",
    industry2Body: "希少な動作、シーン、インタラクションのデータを補完。",
    industry3Tag: "自動運転",
    industry3Title: "極端条件のデータを合成",
    industry3Body: "収集しにくい天候、道路、突発事象を生成し、ロングテールを補完。",
    modelsTitle: "すべての動画に<br />同じ答えは必要ない。",
    modelsIntro: "複雑な制作は品質と制御を、量産はコストと速度を優先します。",
    model25Tag: "品質と制御を優先",
    modelMiniTag: "コストと量産を優先",
    modelFit: "用途",
    model25Fit: "複雑な物語、TVC、ショートドラマ、ブランド映像",
    modelMiniFit: "ECコンテンツ、素材量産、高速テスト",
    modelNarrative: "物語",
    model25Narrative: "30秒の物語と高精度な続き生成",
    modelMiniNarrative: "短尺動画を効率よく生成",
    modelControl: "参考と編集",
    model25Control: "50件のマルチモーダル参照、部分編集、複雑な指示",
    modelMiniControl: "高頻度の反復に適した軽量な制作",
    modelPriority: "優先",
    model25Priority: "品質、制御、完成した物語",
    modelMiniPriority: "コスト、速度、規模化",
    closingTitle: "アイデアから<br /><em>完成まで。</em>",
    notifyPrompt: "今すぐ登録しない場合は、メールアドレスを残してください。公開日にお知らせします。",
    emailLabel: "メールアドレス",
    emailPlaceholder: "メールアドレス",
    notifySubmit: "公開日に通知",
    notifyInvalid: "有効なメールアドレスを入力してください。",
    notifySending: "送信中…",
    notifySuccess: "登録しました。公開日にお知らせします。",
    notifyFallback: "メールアプリを開きます。用意されたメールを送信して登録を完了してください。",
    notifyError: "送信できませんでした。再試行するか、cs@holycrab.ai までご連絡ください。",
    footerAttribution:
      "SeedanceはByteDanceのモデルです。HolyCrabはBytePlusとの直接契約に基づきアクセスを提供しています。",
  },
};

const phaseCopy = {
  A: {
    zh: {
      title: "Seedance 2.5 即将上线 — 提前注册领优先体验 | HolyCrab",
      description:
        "Seedance 2.5 即将上线（以官方发布为准）：30 秒长叙事、最多 50 个全模态参考、精准局部编辑。提前注册，上线第一时间优先体验。",
      badge: "COMING SOON",
      heroTitle: "Seedance 2.5<br />即将上线",
      heroNotice: "",
      navCta: "立即注册",
      heroCta: "立即注册（领白名单）",
      workflowCta: "预约 Seedance 2.5 优先体验",
      footerCta: "注册预约优先体验",
    },
    en: {
      title: "Seedance 2.5 — Coming Soon | HolyCrab",
      description:
        "Seedance 2.5 is coming soon, subject to official release. Register early for priority access at launch.",
      badge: "COMING SOON",
      heroTitle: "Seedance 2.5<br />Coming Soon",
      heroNotice: "",
      navCta: "Register",
      heroCta: "Register for the waitlist",
      workflowCta: "Reserve priority access",
      footerCta: "Register for priority access",
    },
    ja: {
      title: "Seedance 2.5 まもなく登場 | HolyCrab",
      description: "Seedance 2.5 はまもなく登場。事前登録で、公開時の優先体験をご案内します。",
      badge: "COMING SOON",
      heroTitle: "Seedance 2.5<br />まもなく登場",
      heroNotice: "",
      navCta: "事前登録",
      heroCta: "優先体験に登録",
      workflowCta: "Seedance 2.5 の優先体験を予約",
      footerCta: "優先体験に登録",
    },
  },
  B: {
    zh: {
      title: "Seedance 2.5 即将上线 | HolyCrab",
      description: "BytePlus 已官宣 Seedance 2.5，HolyCrab 第一时间接入。加入白名单，优先体验。",
      badge: "官宣已至 · 白名单限时开放",
      heroTitle: "Seedance 2.5<br />即将上线",
      heroNotice: "BytePlus 已官宣，HolyCrab 第一时间接入",
      navCta: "加入白名单",
      heroCta: "加入白名单",
      workflowCta: "加入 Seedance 2.5 白名单",
      footerCta: "加入白名单",
    },
    en: {
      title: "Seedance 2.5 Announced | HolyCrab",
      description: "Seedance 2.5 has been announced by BytePlus. Join the HolyCrab waitlist for priority access.",
      badge: "ANNOUNCED · WAITLIST OPEN",
      heroTitle: "Seedance 2.5<br />Coming Soon",
      heroNotice: "Announced by BytePlus. HolyCrab is preparing access now.",
      navCta: "Join waitlist",
      heroCta: "Join waitlist",
      workflowCta: "Join the Seedance 2.5 waitlist",
      footerCta: "Join waitlist",
    },
    ja: {
      title: "Seedance 2.5 発表 | HolyCrab",
      description: "BytePlus が Seedance 2.5 を発表。HolyCrab の優先体験リストにご登録ください。",
      badge: "正式発表 · リスト受付中",
      heroTitle: "Seedance 2.5<br />まもなく登場",
      heroNotice: "BytePlus が正式発表。HolyCrab はいち早く接続準備を進めています。",
      navCta: "リストに登録",
      heroCta: "リストに登録",
      workflowCta: "Seedance 2.5 のリストに登録",
      footerCta: "リストに登録",
    },
  },
  C: {
    zh: {
      title: "Seedance 2.5 现已可用 | HolyCrab",
      description: "Seedance 2.5 现已可用。立即注册 HolyCrab，开始生成。",
      badge: "NOW LIVE",
      heroTitle: "Seedance 2.5<br />现已可用",
      heroNotice: "",
      navCta: "立即生成",
      heroCta: "立即生成",
      workflowCta: "使用 Seedance 2.5 生成",
      footerCta: "立即生成",
    },
    en: {
      title: "Seedance 2.5 Now Live | HolyCrab",
      description: "Seedance 2.5 is now available on HolyCrab. Register and start generating.",
      badge: "NOW LIVE",
      heroTitle: "Seedance 2.5<br />Now Live",
      heroNotice: "",
      navCta: "Generate now",
      heroCta: "Generate now",
      workflowCta: "Generate with Seedance 2.5",
      footerCta: "Generate now",
    },
    ja: {
      title: "Seedance 2.5 提供開始 | HolyCrab",
      description: "Seedance 2.5 が HolyCrab で利用可能になりました。登録して生成を始めましょう。",
      badge: "NOW LIVE",
      heroTitle: "Seedance 2.5<br />提供開始",
      heroNotice: "",
      navCta: "今すぐ生成",
      heroCta: "今すぐ生成",
      workflowCta: "Seedance 2.5 で生成",
      footerCta: "今すぐ生成",
    },
  },
};

const phaseCampaigns = { A: "sd25_preheat", B: "sd25_announce", C: "sd25_live" };
const phaseElements = Array.from(document.querySelectorAll("[data-phase-copy]"));
const ctaLinks = Array.from(document.querySelectorAll("[data-cta-position]"));
const metaDescription = document.querySelector('meta[name="description"]');
const robotsMeta = document.querySelector('meta[name="robots"]');

const applyPhase = (language) => {
  const copy = phaseCopy[PHASE]?.[language] || phaseCopy.A.zh;
  document.documentElement.dataset.phase = PHASE;
  document.title = copy.title;
  metaDescription?.setAttribute("content", copy.description);

  if (PHASE === "A") {
    robotsMeta?.setAttribute("content", "noindex");
  } else {
    robotsMeta?.remove();
  }

  phaseElements.forEach((element) => {
    const value = copy[element.dataset.phaseCopy];
    if (value == null) return;

    if (element.dataset.phaseCopy === "heroTitle") {
      element.innerHTML = value;
    } else {
      element.textContent = value;
    }
  });

  ctaLinks.forEach((link) => {
    const url = new URL(link.href);
    url.searchParams.set("utm_source", "sd25lp");
    url.searchParams.set("utm_medium", "landing");
    url.searchParams.set("utm_campaign", phaseCampaigns[PHASE]);
    url.searchParams.set("utm_content", link.dataset.ctaPosition);
    link.href = url.toString();
  });
};

if (PLAUSIBLE_SITE_ID) {
  window.plausible =
    window.plausible ||
    function plausible(...args) {
      (window.plausible.q = window.plausible.q || []).push(args);
    };

  const plausibleScript = document.createElement("script");
  plausibleScript.defer = true;
  plausibleScript.src = `https://plausible.io/js/${encodeURIComponent(PLAUSIBLE_SITE_ID)}.js`;
  document.head.append(plausibleScript);
}

const trackEvent = (name, properties = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...properties });
  window.plausible?.(name, { props: properties });
  window.dispatchEvent(new CustomEvent("holycrab:analytics", { detail: { name, properties } }));
};

ctaLinks.forEach((link) => {
  link.addEventListener("click", () => {
    trackEvent("cta_click", { position: link.dataset.ctaPosition, phase: PHASE });
  });
});

const waitlistForm = document.querySelector("#waitlist-form");
const waitlistEmail = document.querySelector("#waitlist-email");
const waitlistStatus = document.querySelector("#waitlist-status");

const waitlistMessages = {
  zh: {
    notifyInvalid: "请输入有效的邮箱地址。",
    notifySending: "正在提交…",
    notifySuccess: "已登记，上线当天会第一时间通知你。",
    notifyFallback: "正在打开邮件应用，请发送已准备好的邮件完成登记。",
    notifyError: "提交失败，请重试或发送邮件至 cs@holycrab.ai。",
  },
  en: translations.en,
  ja: translations.ja,
};

const setWaitlistStatus = (message, state = "") => {
  if (!waitlistStatus) return;
  waitlistStatus.textContent = message;
  waitlistStatus.dataset.state = state;
};

waitlistForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const messages = waitlistMessages[currentLanguage] || waitlistMessages.zh;
  const email = waitlistEmail?.value.trim() || "";

  if (!waitlistEmail?.checkValidity()) {
    setWaitlistStatus(messages.notifyInvalid, "error");
    waitlistEmail?.focus();
    return;
  }

  const payload = {
    email,
    phase: PHASE,
    language: currentLanguage,
    source: "sd25lp",
    submitted_at: new Date().toISOString(),
  };

  if (!WAITLIST_ENDPOINT) {
    const subject = encodeURIComponent("Seedance 2.5 上线通知登记");
    const body = encodeURIComponent(
      `邮箱：${email}\n页面语言：${currentLanguage}\n提交时间：${payload.submitted_at}`,
    );
    setWaitlistStatus(messages.notifyFallback);
    window.location.href = `mailto:cs@holycrab.ai?subject=${subject}&body=${body}`;
    trackEvent("waitlist_submit", { method: "email_fallback", language: currentLanguage, phase: PHASE });
    return;
  }

  const submitButton = waitlistForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setWaitlistStatus(messages.notifySending);

  try {
    const response = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Waitlist request failed: ${response.status}`);

    waitlistForm.reset();
    setWaitlistStatus(messages.notifySuccess, "success");
    trackEvent("waitlist_submit", { method: "api", language: currentLanguage, phase: PHASE });
  } catch {
    setWaitlistStatus(messages.notifyError, "error");
  } finally {
    submitButton.disabled = false;
  }
});

const mediaCopy = {
  zh: {
    pause: "暂停",
    play: "播放",
    sound: "打开声音",
    mute: "关闭声音",
    original: "查看原片",
    casePlay: "播放案例",
    casePause: "暂停",
    caseReplay: "重播案例",
    unavailable: "前往原文",
  },
  en: {
    pause: "Pause",
    play: "Play",
    sound: "Turn sound on",
    mute: "Turn sound off",
    original: "View film",
    casePlay: "Play case",
    casePause: "Pause",
    caseReplay: "Replay",
    unavailable: "View source",
  },
  ja: {
    pause: "一時停止",
    play: "再生",
    sound: "音声をオン",
    mute: "音声をオフ",
    original: "原編を見る",
    casePlay: "事例を再生",
    casePause: "一時停止",
    caseReplay: "もう一度再生",
    unavailable: "原文を見る",
  },
};

let currentLanguage = "zh";
const languageLabels = { zh: "中", en: "EN", ja: "日" };

let heroUsesPosterFallback = false;

const getMediaCopy = () => mediaCopy[currentLanguage];

const soundIcons = {
  sound: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>`,
  mute: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 5" />
      <path d="m21 9-5 5" />
    </svg>`,
};

const siteVideos = Array.from(document.querySelectorAll("main video"));
const contentVideos = siteVideos.filter((video) => video !== heroVideo);
const contentAudioButtons = new Map();

const setAudioButton = (button, video) => {
  if (!button || !video) return;

  const isMuted = video.muted;
  button.querySelector(".media-icon").innerHTML = isMuted ? soundIcons.mute : soundIcons.sound;
  button.setAttribute("aria-label", isMuted ? getMediaCopy().sound : getMediaCopy().mute);
  button.setAttribute("aria-pressed", String(!isMuted));
  button.title = isMuted ? getMediaCopy().sound : getMediaCopy().mute;
};

const setSoundButton = () => {
  setAudioButton(soundToggle, heroVideo);
};

const syncAudioButtons = () => {
  setSoundButton();
  contentVideos.forEach((video) => setAudioButton(contentAudioButtons.get(video), video));
};

const toggleVideoAudio = async (video) => {
  if (!video) return;

  if (!video.muted) {
    video.muted = true;
    syncAudioButtons();
    return;
  }

  siteVideos.forEach((otherVideo) => {
    otherVideo.muted = otherVideo !== video;
  });
  video.muted = false;

  try {
    await video.play();
  } catch {
    video.muted = true;
  }

  syncAudioButtons();
};

const activateHeroFallback = () => {
  heroUsesPosterFallback = true;
  soundToggle.hidden = true;
};

soundToggle.addEventListener("click", () => toggleVideoAudio(heroVideo));

heroVideo.addEventListener("timeupdate", () => {
  if (heroVideo.currentTime <= 0.1) return;
  heroUsesPosterFallback = false;
  soundToggle.hidden = false;
  setSoundButton();
});
heroVideo.addEventListener("error", activateHeroFallback);
heroVideo.play().catch(() => {});
setSoundButton();

contentVideos.forEach((video) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "media-button icon-only video-sound-toggle";
  button.innerHTML = '<span class="media-icon" aria-hidden="true"></span>';
  button.addEventListener("click", () => toggleVideoAudio(video));
  video.parentElement?.append(button);
  contentAudioButtons.set(video, button);
  setAudioButton(button, video);
});

window.setTimeout(() => {
  const isActuallyPlaying =
    heroVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && heroVideo.currentTime > 0.1;
  if (!isActuallyPlaying) activateHeroFallback();
}, 4500);

document.querySelectorAll(".feature-media video").forEach((video) => {
  const button = video.parentElement.querySelector(".case-play");

  if (!button) {
    video.play().catch(() => {});
    return;
  }

  const toggleCase = async () => {
    if (video.paused) {
      try {
        await video.play();
        button.textContent = getMediaCopy().casePause;
        button.setAttribute("aria-label", getMediaCopy().casePause);
      } catch {
        button.textContent = getMediaCopy().unavailable;
        button.addEventListener("click", () => window.open(sourceDocument, "_blank", "noopener,noreferrer"), {
          once: true,
        });
      }
    } else {
      video.pause();
      button.textContent = getMediaCopy().casePlay;
      button.setAttribute("aria-label", getMediaCopy().casePlay);
    }
  };

  button.addEventListener("click", toggleCase);
  video.addEventListener("click", toggleCase);
  video.addEventListener("ended", () => {
    button.textContent = getMediaCopy().caseReplay;
  });
});

const ambientVideos = document.querySelectorAll(".industry-video video, .workflow-video video");
const ambientVideoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  },
  { threshold: 0.25 },
);

ambientVideos.forEach((video) => ambientVideoObserver.observe(video));

const audioVisibilityObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.target.muted) return;
      entry.target.muted = true;
      syncAudioButtons();
    });
  },
  { threshold: 0.2 },
);

siteVideos.forEach((video) => audioVisibilityObserver.observe(video));

const syncTranslatedControls = () => {
  if (heroUsesPosterFallback) {
    activateHeroFallback();
  } else {
    setSoundButton();
  }

  syncAudioButtons();

  document.querySelectorAll(".feature-media video").forEach((video) => {
    const button = video.parentElement.querySelector(".case-play");
    if (!button) return;
    button.textContent = video.paused ? getMediaCopy().casePlay : getMediaCopy().casePause;
  });
};

const setLanguageMenu = (isOpen) => {
  languageTrigger.setAttribute("aria-expanded", String(isOpen));
  languageOptions.hidden = !isOpen;
};

const applyLanguage = (language) => {
  currentLanguage = language;
  const dictionary = translations[language] || {};

  translatableElements.forEach((element) => {
    const key = element.dataset.i18n || element.dataset.i18nHtml || element.dataset.i18nPlaceholder;
    const translated = language === "zh" ? originalContent.get(element) : dictionary[key];
    if (translated == null) return;

    if (element.hasAttribute("data-i18n-placeholder")) {
      element.setAttribute("placeholder", translated);
    } else if (element.hasAttribute("data-i18n-html")) {
      element.innerHTML = translated;
    } else {
      element.textContent = translated;
    }
  });

  document.documentElement.lang = { zh: "zh-CN", en: "en", ja: "ja" }[language];
  applyPhase(language);

  languageButtons.forEach((button) => {
    button.setAttribute("aria-checked", String(button.dataset.lang === language));
  });
  currentLanguageLabel.textContent = languageLabels[language];

  syncTranslatedControls();

  try {
    window.localStorage.setItem("seedance-language", language);
  } catch {
    // Language preference persistence is optional.
  }
};

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
    setLanguageMenu(false);
  });
});

languageTrigger.addEventListener("click", () => {
  setLanguageMenu(languageTrigger.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("click", (event) => {
  if (!languageMenu.contains(event.target)) setLanguageMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  setLanguageMenu(false);
  languageTrigger.focus();
});

let savedLanguage = "zh";
try {
  const storedLanguage = window.localStorage.getItem("seedance-language");
  if (["zh", "en", "ja"].includes(storedLanguage)) savedLanguage = storedLanguage;
} catch {
  // Continue with Chinese when storage is unavailable.
}
applyLanguage(savedLanguage);

const revealItems = Array.from(document.querySelectorAll(".reveal")).filter(
  (item) => !item.closest(".capabilities") && !item.closest(".workflow-steps"),
);
const stagedCapabilityReveals = [
  [".capabilities .feature-media.reveal, .capabilities .feature h3.reveal", "0px 0px -40px"],
  [".capability-body", "0px 0px -16%"],
  [".capability-tags", "0px 0px -30%"],
];
const workflowStepReveals = Array.from(document.querySelectorAll(".workflow-steps .reveal"));
const workflowStepRootMargins = ["0px 0px -8%", "0px 0px -24%", "0px 0px -40%", "0px 0px -41%"];
let lastScrollY = window.scrollY;
let isScrollingUp = false;

window.addEventListener(
  "scroll",
  () => {
    isScrollingUp = window.scrollY < lastScrollY;
    lastScrollY = window.scrollY;
  },
  { passive: true },
);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  stagedCapabilityReveals.forEach(([selector, rootMargin]) => {
    const stageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            return;
          }

          if (isScrollingUp) entry.target.classList.remove("is-visible");
        });
      },
      { threshold: 0.12, rootMargin },
    );

    document.querySelectorAll(selector).forEach((item) => stageObserver.observe(item));
  });

  workflowStepReveals.forEach((step, index) => {
    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            return;
          }

          if (isScrollingUp) entry.target.classList.remove("is-visible");
        });
      },
      { threshold: 0.12, rootMargin: workflowStepRootMargins[index] },
    );

    stepObserver.observe(step);
  });
} else {
  document.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
}

const statCounts = Array.from(document.querySelectorAll("[data-stat-count]"));
const releaseFacts = document.querySelector(".release-facts");
const setStatCount = (element, value) => {
  element.textContent = `${value}${element.dataset.statSuffix ?? ""}`;
};

let statAnimationCycle = 0;

const animateStatCount = (element, delay, cycle) => {
  const target = Number(element.dataset.statCount);
  const container = element.parentElement;
  const duration = 980;
  let startTime;

  container?.classList.add("is-counting");

  const frame = (timestamp) => {
    if (cycle !== statAnimationCycle) return;

    if (startTime === undefined) startTime = timestamp + delay;
    if (timestamp < startTime) {
      requestAnimationFrame(frame);
      return;
    }

    const progress = Math.min(1, (timestamp - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    setStatCount(element, Math.round(target * eased));

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    setStatCount(element, target);
    container?.classList.remove("is-counting");
  };

  requestAnimationFrame(frame);
};

const startStatCounts = () => {
  const cycle = ++statAnimationCycle;
  statCounts.forEach((element) => setStatCount(element, 0));
  statCounts.forEach((element, index) => animateStatCount(element, index * 120, cycle));
};

const resetStatCounts = () => {
  ++statAnimationCycle;
  statCounts.forEach((element) => {
    element.parentElement?.classList.remove("is-counting");
    setStatCount(element, 0);
  });
};

if (reduceMotion || !("IntersectionObserver" in window) || !releaseFacts) {
  statCounts.forEach((element) => setStatCount(element, Number(element.dataset.statCount)));
} else {
  const statObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        startStatCounts();
        return;
      }

      resetStatCounts();
    },
    { threshold: 0.34 },
  );

  statObserver.observe(releaseFacts);
}
