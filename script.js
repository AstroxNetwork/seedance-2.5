const heroVideo = document.querySelector("#reboot-video");
const hero = document.querySelector(".hero");
const heroTitle = document.querySelector("#hero-title");
const soundToggle = document.querySelector("#sound-toggle");
const PHASE = ["A", "B", "C"].includes(window.SEEDANCE_PHASE) ? window.SEEDANCE_PHASE : "A";
const WAITLIST_ENDPOINT = window.SEEDANCE_WAITLIST_ENDPOINT?.trim() || "";
const PLAUSIBLE_SITE_ID = window.SEEDANCE_PLAUSIBLE_SITE_ID?.trim() || "";
const GA_ID = window.SEEDANCE_GA_ID?.trim() || "";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sourceDocument = "https://holycrab.ai/seedance-2-5/";
const INBOUND_PARAMS = new URLSearchParams(window.location.search);
const LANGUAGE_LOCALES = { zh: "zh-CN", zhHant: "zh-TW", en: "en-US", ja: "ja-JP" };
const LANGUAGE_URL_CODES = { zh: "zh", zhHant: "zh-TW", en: "en", ja: "ja" };
const LOCALE_LANGUAGES = Object.fromEntries(
  Object.entries(LANGUAGE_LOCALES).map(([language, locale]) => [locale.toLowerCase(), language]),
);
const URL_CODE_LANGUAGES = Object.fromEntries(
  Object.entries(LANGUAGE_URL_CODES).map(([language, code]) => [code.toLowerCase(), language]),
);
const normaliseLanguageParam = (value) => value?.replace("_", "-").toLowerCase();
const languageFromQuery =
  URL_CODE_LANGUAGES[normaliseLanguageParam(INBOUND_PARAMS.get("lang"))] ||
  LOCALE_LANGUAGES[normaliseLanguageParam(INBOUND_PARAMS.get("locale"))];
const INBOUND_UTM = Object.fromEntries(
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
    .map((key) => [key, INBOUND_PARAMS.get(key)])
    .filter(([, value]) => value),
);
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
  borderRadius: 20,
  borderWidth: 0.07,
  backgroundOpacity: 0,
  brightness: 70,
  opacity: 0.93,
  blur: 11,
  displace: 0.5,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20,
};

const navSurface = document.querySelector(".site-nav");
navSurface?.style.setProperty(
  "--nav-background-opacity",
  supportsNavRefraction ? navGlassSettings.backgroundOpacity : 0.25,
);
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
  zhHant: {
    skip: "跳至主要內容",
    navCapabilities: "能力",
    navWorkflow: "用法",
    navIndustries: "行業",
    navModels: "選型",
    navTry: "前往嘗試",
    heroSubtitle: "提前註冊帳號，上線優先體驗！",
    factDuration: "單段直出",
    factAssets: "參考素材數量上限",
    factLanguagesValue: "多語言",
    factLanguages: "理解與表達",
    explore: "查看詳情",
    casePlay: "播放案例",
    caseNarrative: "情緒房間 · 00:30",
    feature1Title: "30 秒直出，<br />故事完整呈現。",
    feature1Body: "單段最長 30 秒。人物、場景和鏡頭保持連貫，適合廣告片、短劇和品牌內容。",
    feature1Point1: "單段最長 30 秒",
    feature1Point2: "跨鏡人物與場景穩定",
    feature1Point3: "支援高保真續寫",
    caseReferences: "多模態參考",
    feature2Title: "最多 50 個參考，<br />創作設定一次講清。",
    feature2Body:
      "圖片、影片、音訊和文字可同時參考。角色、產品、場景、動作和聲音，不用擠進一條提示詞。",
    feature2Point1: "50 個多模態參考",
    feature2Point2: "多角色、多場景協同",
    feature2Point3: "主體與運動更穩定",
    caseEditing: "局部編輯",
    feature3Title: "只改想改的，<br />不必推翻整條片。",
    feature3Body: "局部替換物件、調整動作、修正細節，盡量保留原有構圖、節奏和質感。",
    feature3Point1: "局部替換",
    feature3Point2: "時序可控",
    feature3Point3: "減少返工",
    caseLanguage: "多語言創作",
    feature4Title: "多語言創作，<br />創意不再需要翻譯一次。",
    feature4Body: "用熟悉的語言描述鏡頭、表演和節奏，讓創作意圖更準確地抵達畫面。",
    feature4Point1: "更強的多語言理解與表達",
    feature4Point2: "複雜指令理解",
    feature4Point3: "面向全球團隊",
    capabilitiesDisclaimer: "預覽素材——為網頁展示做過後製處理；最終能力以官方發布為準。",
    workflowTitle: "從靈感到交付，四步完成",
    step1Title: "寫下創意",
    step1Body: "寫下故事、鏡頭和情緒。",
    step2Title: "添加參考",
    step2Body: "加入角色、產品、場景、動作和音訊。",
    step3Title: "生成敘事",
    step3Body: "選擇時長和畫幅，生成完整片段。",
    step4Title: "準確精修",
    step4Body: "局部修改畫面，直接用於交付。",
    industriesTitle: "不只生成廣告，<br /><em>也生成產業資料。</em>",
    industry1Tag: "製造業 / 零售業",
    industry1Title: "產品影片說明書",
    industry1Body: "把產品結構、操作與賣點，轉成清晰的影片內容。",
    industry2Tag: "具身智慧",
    industry2Title: "合成機器人訓練資料",
    industry2Body: "補足稀缺的動作、場景和互動資料。",
    industry3Tag: "自動駕駛",
    industry3Title: "合成極端場景資料",
    industry3Body: "生成難採集的天氣、道路和突發場景，補足長尾資料。",
    modelsTitle: "不是每條影片，<br />都需要同一種解法。",
    modelsIntro: "複雜創作優先品質與控制；規模生產優先成本與效率。",
    model25Tag: "品質與控制優先",
    modelMiniTag: "成本與規模優先",
    modelFit: "適合",
    model25Fit: "複雜敘事、TVC、短劇、品牌內容",
    modelMiniFit: "電商內容、批量素材、快速測試",
    modelNarrative: "敘事",
    model25Narrative: "30 秒敘事，支援高保真續寫",
    modelMiniNarrative: "高效生成短片段",
    modelControl: "參考與編輯",
    model25Control: "50 個多模態參考；局部編輯、複雜指令",
    modelMiniControl: "輕量創作，適合高頻迭代",
    modelPriority: "優先",
    model25Priority: "品質、控制、完整敘事",
    modelMiniPriority: "成本、速度、規模化",
    closingTitle: "從創意，<br /><em>到成片。</em>",
    notifyPrompt: "現在不想註冊？留下電子郵件，上線當天第一時間通知你。",
    emailLabel: "電子郵件",
    emailPlaceholder: "你的電子郵件",
    notifySubmit: "上線時通知我",
    notifyInvalid: "請輸入有效的電子郵件地址。",
    notifySending: "正在提交…",
    notifySuccess: "已登記，上線當天會第一時間通知你。",
    notifyFallback: "正在開啟郵件應用程式，請發送已準備好的郵件完成登記。",
    notifyError: "提交失敗，請重試或發送郵件至 cs@holycrab.ai。",
    footerAttribution: "Seedance 是 ByteDance 旗下模型。HolyCrab 透過與 BytePlus 的直接協議提供存取服務。",
  },
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
    capabilitiesDisclaimer: "Preview footage — post-processed for the web; final capabilities subject to official release.",
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
    capabilitiesDisclaimer: "プレビュー映像です。Web 表示用に後処理を加えており、最終的な機能は正式リリースに準じます。",
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
      heroCta: "立即注册",
      workflowCta: "预约 Seedance 2.5 优先体验",
      footerCta: "注册预约优先资格",
    },
    zhHant: {
      title: "Seedance 2.5 即將上線 — 提前註冊享優先體驗 | HolyCrab",
      description:
        "Seedance 2.5 即將上線（以官方發布為準）：30 秒長敘事、最多 50 個全模態參考、精準局部編輯。提前註冊，上線第一時間優先體驗。",
      badge: "COMING SOON",
      heroTitle: "Seedance 2.5<br />即將上線",
      heroNotice: "",
      navCta: "立即註冊",
      heroCta: "立即註冊（搶優先體驗名額）",
      workflowCta: "預約 Seedance 2.5 優先體驗",
      footerCta: "註冊預約優先體驗",
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
      description: "BytePlus 已官宣 Seedance 2.5，HolyCrab 第一时间接入。预约报名，优先体验。",
      badge: "官宣已至 · 优先体验名额限时开放",
      heroTitle: "Seedance 2.5<br />即将上线",
      heroNotice: "BytePlus 已官宣，HolyCrab 第一时间接入",
      navCta: "预约优先体验",
      heroCta: "预约优先体验",
      workflowCta: "预约 Seedance 2.5 优先体验",
      footerCta: "预约优先体验",
    },
    zhHant: {
      title: "Seedance 2.5 即將上線 | HolyCrab",
      description: "BytePlus 已正式公布 Seedance 2.5，HolyCrab 第一時間接入。預約報名，優先體驗。",
      badge: "正式公布 · 優先體驗名額限時開放",
      heroTitle: "Seedance 2.5<br />即將上線",
      heroNotice: "BytePlus 已正式公布，HolyCrab 第一時間接入",
      navCta: "預約優先體驗",
      heroCta: "預約優先體驗",
      workflowCta: "預約 Seedance 2.5 優先體驗",
      footerCta: "預約優先體驗",
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
    zhHant: {
      title: "Seedance 2.5 現已可用 | HolyCrab",
      description: "Seedance 2.5 現已可用。立即註冊 HolyCrab，開始生成。",
      badge: "NOW LIVE",
      heroTitle: "Seedance 2.5<br />現已可用",
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
const heroDecryptCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
let heroDecryptFrame = 0;
let heroDecryptDelay = 0;

const heroTitleMarkup = (text) =>
  text
    .replace(/\n/g, "<br />")
    .replace("2.5", '<span class="hero-model-version">2.<span class="hero-model-five">5</span></span>');

const setHeroTitle = (value) => {
  if (!heroTitle) return;

  const title = value.replace(/<br\s*\/?>/gi, "\n");
  const targetCharacters = Array.from(title);
  const plainTitle = title.replace(/\n/g, " ");

  window.cancelAnimationFrame(heroDecryptFrame);
  window.clearTimeout(heroDecryptDelay);
  heroTitle.setAttribute("aria-label", plainTitle);

  const renderFinalTitle = () => {
    heroTitle.innerHTML = heroTitleMarkup(title);
  };

  if (reduceMotion) {
    renderFinalTitle();
    return;
  }

  const startDecrypt = () => {
    const startedAt = window.performance.now();
    const duration = 920;

    const renderFrame = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const revealedCharacters = Math.floor(progress * targetCharacters.length);
      const decrypted = targetCharacters
        .map((character, index) => {
          if (character === "\n" || character === " " || index < revealedCharacters) return character;
          return heroDecryptCharacters[Math.floor(Math.random() * heroDecryptCharacters.length)];
        })
        .join("");

      heroTitle.innerHTML = heroTitleMarkup(decrypted);

      if (progress < 1) {
        heroDecryptFrame = window.requestAnimationFrame(renderFrame);
      } else {
        renderFinalTitle();
      }
    };

    heroDecryptFrame = window.requestAnimationFrame(renderFrame);
  };

  heroDecryptDelay = window.setTimeout(startDecrypt, heroTitle.classList.contains("is-visible") ? 0 : 420);
};

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
      setHeroTitle(value);
    } else {
      element.textContent = value;
    }
  });

  ctaLinks.forEach((link) => {
    const url = new URL(link.href);
    url.searchParams.set("utm_source", INBOUND_UTM.utm_source || "sd25lp");
    url.searchParams.set("utm_medium", INBOUND_UTM.utm_medium || "landing");
    url.searchParams.set("utm_campaign", INBOUND_UTM.utm_campaign || phaseCampaigns[PHASE]);
    url.searchParams.set("utm_content", link.dataset.ctaPosition);
    const inboundTerm = INBOUND_UTM.utm_term || INBOUND_UTM.utm_content;
    if (inboundTerm) url.searchParams.set("utm_term", inboundTerm);
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

if (GA_ID && !window.gtag) {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
}

const trackEvent = (name, properties = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...properties });
  window.gtag?.("event", name, properties);
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
  zhHant: translations.zhHant,
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
    utm: INBOUND_UTM,
    submitted_at: new Date().toISOString(),
  };

  if (!WAITLIST_ENDPOINT) {
    const mailtoSubject = {
      zh: "Seedance 2.5 上线通知登记",
      zhHant: "Seedance 2.5 上線通知登記",
      en: "Seedance 2.5 launch notification signup",
      ja: "Seedance 2.5 公開通知の登録",
    };
    const subject = encodeURIComponent(mailtoSubject[currentLanguage] || mailtoSubject.en);
    const body = encodeURIComponent(
      `email: ${email}\nlanguage: ${currentLanguage}\nsubmitted_at: ${payload.submitted_at}`,
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
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.stored !== true) {
      throw new Error(`Waitlist request failed: ${response.status}`);
    }

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
  zhHant: {
    pause: "暫停",
    play: "播放",
    sound: "開啟聲音",
    mute: "關閉聲音",
    original: "查看原片",
    casePlay: "播放案例",
    casePause: "暫停",
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
const languageLabels = { zh: "简", zhHant: "繁", en: "EN", ja: "日" };

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
const capabilityVideos = Array.from(document.querySelectorAll(".capabilities .feature-media video"));
const contentVideos = siteVideos.filter(
  (video) => video !== heroVideo && !video.closest(".industry-video") && !video.closest(".capabilities"),
);
const contentAudioButtons = new Map();
const capabilityAudioButtons = new Map();

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
  capabilityVideos.forEach((video) => setAudioButton(capabilityAudioButtons.get(video), video));
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

capabilityVideos.forEach((video) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "media-button icon-only video-sound-toggle capability-audio-toggle";
  button.innerHTML = '<span class="media-icon" aria-hidden="true"></span>';
  button.addEventListener("click", () => toggleVideoAudio(video));
  video.parentElement?.append(button);
  capabilityAudioButtons.set(video, button);
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

const capabilityFeatures = Array.from(document.querySelectorAll(".capabilities .feature"));
const capabilityHoverMedia = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 641px)");
let expandedCapability = null;
let capabilityCollapseTimer = 0;

const setCapabilityVideoPlayback = async (feature, shouldPlay) => {
  const video = feature?.querySelector(".feature-media video");
  if (!video) return;

  if (!shouldPlay) {
    video.muted = true;
    syncAudioButtons();
    return;
  }

  try {
    await video.play();
  } catch {
    video.muted = true;
  }

  syncAudioButtons();
};

const resetCapabilityExpansion = (feature, shouldMute = true) => {
  if (!feature) return;

  const media = feature.querySelector(".feature-media");
  if (shouldMute) setCapabilityVideoPlayback(feature, false);
  window.clearTimeout(capabilityCollapseTimer);
  feature.classList.remove("is-video-expanded", "is-video-expanded-open");
  media?.style.removeProperty("--capability-video-top");
  media?.style.removeProperty("--capability-video-left");
  media?.style.removeProperty("--capability-video-width");
  media?.style.removeProperty("--capability-video-height");
  document.body.classList.remove("capability-video-open");

  if (expandedCapability === feature) {
    expandedCapability = null;
  }
};

const collapseCapability = (feature = expandedCapability) => {
  if (!feature?.classList.contains("is-video-expanded-open")) return;

  setCapabilityVideoPlayback(feature, false);
  feature.classList.remove("is-video-expanded-open");
  document.body.classList.remove("capability-video-open");
  window.clearTimeout(capabilityCollapseTimer);
  capabilityCollapseTimer = window.setTimeout(() => resetCapabilityExpansion(feature, false), 500);
};

const expandCapability = (feature) => {
  if (!capabilityHoverMedia.matches) return;

  const media = feature.querySelector(".feature-media");
  if (!media) return;

  setCapabilityVideoPlayback(feature, true);

  if (expandedCapability && expandedCapability !== feature) {
    resetCapabilityExpansion(expandedCapability);
  }

  if (feature.classList.contains("is-video-expanded")) {
    window.clearTimeout(capabilityCollapseTimer);
    document.body.classList.add("capability-video-open");
    feature.classList.add("is-video-expanded-open");
    return;
  }

  const bounds = media.getBoundingClientRect();
  media.style.setProperty("--capability-video-top", `${bounds.top}px`);
  media.style.setProperty("--capability-video-left", `${bounds.left}px`);
  media.style.setProperty("--capability-video-width", `${bounds.width}px`);
  media.style.setProperty("--capability-video-height", `${bounds.height}px`);
  feature.classList.add("is-video-expanded");
  document.body.classList.add("capability-video-open");
  expandedCapability = feature;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (expandedCapability !== feature) return;

      feature.classList.add("is-video-expanded-open");
    });
  });
};

capabilityFeatures.forEach((feature) => {
  const media = feature.querySelector(".feature-media");
  if (!media) return;

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "capability-preview-open";
  openButton.setAttribute("aria-label", "放大视频预览");
  openButton.title = "放大视频预览";
  openButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6"></circle>
      <path d="m20 20-4.2-4.2"></path>
    </svg>`;
  openButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    expandCapability(feature);
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "capability-preview-close";
  closeButton.setAttribute("aria-label", "关闭视频预览");
  closeButton.title = "关闭视频预览";
  closeButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6 6 12 12M18 6 6 18"></path>
    </svg>`;
  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    collapseCapability(feature);
  });

  media.append(openButton, closeButton);
});

window.addEventListener(
  "wheel",
  (event) => {
    if (event.deltaY > 0) collapseCapability();
  },
  { passive: true },
);

window.addEventListener("blur", () => collapseCapability());
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") collapseCapability();
});

const nonHeroVideos = siteVideos.filter((video) => video !== heroVideo);
const videoPlaybackObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.intersectionRatio >= 0.5) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  },
  { threshold: 0.5 },
);

nonHeroVideos.forEach((video) => videoPlaybackObserver.observe(video));

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

const syncLanguageUrl = (language) => {
  const code = LANGUAGE_URL_CODES[language];
  if (!code || !window.history.replaceState) return;

  const url = new URL(window.location.href);
  if (url.searchParams.get("lang") === code && !url.searchParams.has("locale")) return;

  url.searchParams.set("lang", code);
  url.searchParams.delete("locale");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
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

  document.documentElement.lang = LANGUAGE_LOCALES[language];
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

  syncLanguageUrl(language);
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

let savedLanguage = languageFromQuery || "zh";
if (!languageFromQuery) {
  try {
    const storedLanguage = window.localStorage.getItem("seedance-language");
    if (LANGUAGE_LOCALES[storedLanguage]) savedLanguage = storedLanguage;
  } catch {
    // Continue with Chinese when storage is unavailable.
  }
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
const workflowStepRootMargins = ["0px 0px -8%", "0px 0px -13%", "0px 0px -17%", "0px 0px -22%"];
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
const languageStat = document.querySelector(".stat-text[data-i18n='factLanguagesValue']");
const languageStatSequence = ["中文", "日本語", "English", "한국어", "Español", "Français", "Deutsch", "Português", "العربية", "हिन्दी"];
let languageStatTimers = [];

const setStatCount = (element, value) => {
  element.textContent = `${value}${element.dataset.statSuffix ?? ""}`;
};

const getLanguageStatFinalValue = () =>
  currentLanguage === "zh"
    ? originalContent.get(languageStat)
    : translations[currentLanguage]?.factLanguagesValue || originalContent.get(languageStat);

const clearLanguageStatAnimation = () => {
  languageStatTimers.forEach((timer) => window.clearTimeout(timer));
  languageStatTimers = [];
  languageStat?.classList.remove("is-flashing", "is-language-word");
  languageStat?.parentElement?.classList.remove("is-language-cycling");
  if (languageStat) languageStat.textContent = getLanguageStatFinalValue();
};

const animateLanguageStat = (cycle) => {
  if (!languageStat) return;

  clearLanguageStatAnimation();
  languageStat.parentElement?.classList.add("is-language-cycling");

  const setLanguageStatValue = (value, isFinal = false) => {
    if (cycle !== statAnimationCycle) return;

    languageStat.textContent = value;
    languageStat.classList.toggle("is-language-word", !isFinal);
    languageStat.classList.remove("is-flashing");
    void languageStat.offsetWidth;
    languageStat.classList.add("is-flashing");
  };

  languageStatSequence.forEach((language, index) => {
    const timer = window.setTimeout(() => setLanguageStatValue(language), index * 105);
    languageStatTimers.push(timer);
  });

  const finalTimer = window.setTimeout(() => {
    setLanguageStatValue(getLanguageStatFinalValue(), true);
    languageStat.parentElement?.classList.remove("is-language-cycling");
    languageStatTimers = [];
  }, languageStatSequence.length * 105);
  languageStatTimers.push(finalTimer);
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
  animateLanguageStat(cycle);
};

const resetStatCounts = () => {
  ++statAnimationCycle;
  clearLanguageStatAnimation();
  statCounts.forEach((element) => {
    element.parentElement?.classList.remove("is-counting");
    setStatCount(element, 0);
  });
};

if (reduceMotion || !("IntersectionObserver" in window) || !releaseFacts) {
  statCounts.forEach((element) => setStatCount(element, Number(element.dataset.statCount)));
  clearLanguageStatAnimation();
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
