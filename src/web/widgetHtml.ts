type WidgetHtmlOptions = {
  includeAdvancedControls?: boolean;
};

export function widgetHtml(
  appBaseUrl: string,
  providerName: string,
  allowManualTokenLink: boolean,
  options?: WidgetHtmlOptions
): string {
  const includeAdvancedControls = options?.includeAdvancedControls === true;
  const developerToolsSection = includeAdvancedControls && allowManualTokenLink
    ? `<details>
            <summary>Developer tools</summary>
            <div class="details">
              <div class="field-grid">
                <div class="field full"><label for="token">Vibecodr bearer token</label><input id="token" type="password" placeholder="Paste token for local development only" /></div>
                <div class="field"><label for="userId">User id override</label><input id="userId" placeholder="Optional" /></div>
              </div>
              <div class="actions"><button id="linkBtn" class="secondary">Link manual session</button></div>
            </div>
          </details>`
    : "";
  const packageSection = includeAdvancedControls
    ? `<details id="packageDetails" hidden>
            <summary>Package source and raw payload</summary>
            <div class="detail-copy">Open this only when you want to steer the source type, import mode, or JSON directly. The default flow should not require these controls.</div>
            <div class="details detail-block">
              <div class="field-grid">
                <div class="field">
                  <label>Source type</label>
                  <div class="segmented">
                    <button type="button" class="active" data-group="sourceType" data-value="chatgpt_v1">ChatGPT</button>
                    <button type="button" data-group="sourceType" data-value="codex_v1">Codex</button>
                  </div>
                </div>
                <div class="field">
                  <label>Import mode</label>
                  <div class="segmented">
                    <button type="button" class="active" data-group="importMode" data-value="direct_files">Files</button>
                    <button type="button" data-group="importMode" data-value="zip_import">Zip</button>
                    <button type="button" data-group="importMode" data-value="github_import">GitHub</button>
                  </div>
                </div>
              </div>
              <div class="intro">
                <div class="intro-mark">+</div>
                <div><strong>Best default path</strong><p>Connect once, review the package summary, answer any missing launch questions, and use quick publish. Open the raw JSON only when you want to edit the package directly.</p></div>
              </div>
              <div>
                <label for="payload">Package JSON</label>
                <textarea id="payload" placeholder='{
  "title": "My Vibe",
  "runner": "client-static",
  "entry": "src/main.tsx",
  "files": [
    {
      "path": "src/main.tsx",
      "content": "console.log(\"hello vibecodr\");",
      "contentEncoding": "utf8"
    }
  ],
  "importMode": "direct_files"
}'></textarea>
                <div class="helper">Always include <code>entry</code> when you know it. Preferred order: <code>src/main.tsx</code>, <code>src/index.tsx</code>, <code>main.tsx</code>, <code>index.tsx</code>, then <code>index.html</code>. If omitted, Vibecodr infers it and only asks one follow-up when the package is genuinely ambiguous.</div>
              </div>
              <div class="actions">
                <button id="importBtn" class="secondary">Create draft first</button>
              </div>
            </div>
          </details>`
    : "";
  const liveControlsSection = includeAdvancedControls
    ? `<details id="liveControls" hidden>
            <summary>Open live controls</summary>
            <div class="detail-copy">These stay hidden unless the conversation needs a manual compile, publish, refresh, or repair action.</div>
            <div class="details">
              <div class="actions">
                <button id="watchBtn" class="secondary">Watch progress</button>
                <button id="compileBtn" class="secondary">Compile draft</button>
                <button id="publishBtn" class="primary">Publish current draft</button>
              </div>
              <div class="actions" style="margin-top:10px;">
                <button id="getOpBtn" class="tertiary">Refresh operation</button>
                <button id="explainFailureBtn" class="tertiary">Explain failure</button>
                <button id="cancelBtn" class="tertiary">Cancel</button>
              </div>
            </div>
          </details>`
    : "";
  const recoverySection = includeAdvancedControls
    ? `<section class="card collapsed-card" id="recoveryCard" hidden>
          <div class="head"><div><h2>Inspection and recovery</h2><p>These controls stay out of the way until you need to inspect an operation or recover a draft.</p></div></div>
          <details id="recoveryDetails">
            <summary>Open recovery tools</summary>
            <div class="details">
              <div class="field-grid">
                <div class="field"><label for="operationId">Operation id</label><input id="operationId" placeholder="Will populate automatically" /></div>
                <div class="field"><label for="capsuleId">Capsule id</label><input id="capsuleId" placeholder="Will populate automatically" /></div>
              </div>
              <div class="actions">
                <button id="listBtn" class="secondary">List operations</button>
                <button id="listDraftsBtn" class="secondary">List drafts</button>
              </div>
              <details>
                <summary>Raw tool output</summary>
                <div class="details"><pre id="out"></pre></div>
              </details>
            </div>
          </details>
        </section>`
    : `<div hidden aria-hidden="true">
          <div id="recoveryCard" hidden></div>
          <div id="recoveryDetails" hidden></div>
          <button id="listBtn" type="button" hidden></button>
          <button id="listDraftsBtn" type="button" hidden></button>
          <pre id="out"></pre>
        </div>`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Vibecodr.Space Publisher</title>
  <style>
    :root{
      --bg:#fcf6ee;
      --bg-accent:#fff0df;
      --panel:#fffdf9;
      --panel-strong:#ffffff;
      --ink:#181410;
      --muted:#6f6256;
      --line:rgba(106,82,56,.14);
      --line-strong:rgba(106,82,56,.22);
      --mint:#0f9f6e;
      --mint-soft:rgba(15,159,110,.10);
      --rose:#d25744;
      --rose-soft:rgba(210,87,68,.12);
      --amber:#cf8a21;
      --amber-soft:rgba(207,138,33,.14);
      --sky:#5178ff;
      --sky-soft:rgba(81,120,255,.12);
      --gold:#ffb224;
      --peach:#ff8c5a;
      --ink-soft:#3f342c;
      --shadow:0 1px 1px rgba(68,42,14,.04),0 18px 36px rgba(68,42,14,.08);
      --radius:22px;
      --radius-sm:14px;
      --font:"SF Pro Display","Segoe UI",system-ui,sans-serif;
    }
    html[data-theme="dark"]{
      --bg:#0e0b09;
      --bg-accent:#1a130f;
      --panel:#17110f;
      --panel-strong:#211814;
      --ink:#fff6ea;
      --muted:#c5b4a2;
      --line:rgba(255,212,170,.10);
      --line-strong:rgba(255,212,170,.18);
      --mint:#42d49e;
      --mint-soft:rgba(66,212,158,.12);
      --rose:#ff8d72;
      --rose-soft:rgba(255,141,114,.12);
      --amber:#ffc55c;
      --amber-soft:rgba(255,197,92,.12);
      --sky:#9badff;
      --sky-soft:rgba(155,173,255,.14);
      --gold:#ffbe3d;
      --peach:#ff9c66;
      --ink-soft:#eadac9;
      --shadow:0 1px 1px rgba(0,0,0,.22),0 24px 50px rgba(0,0,0,.28);
    }
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%}
    body{
      font-family:var(--font);
      color:var(--ink);
      background:
        radial-gradient(120% 120% at 0% 0%, rgba(255,178,36,.13), transparent 48%),
        radial-gradient(100% 100% at 100% 0%, rgba(255,140,90,.10), transparent 42%),
        linear-gradient(180deg, var(--bg-accent), var(--bg));
    }
    .wrap{max-width:860px;margin:0 auto;padding:18px 14px 34px}
    .hero{
      border:1px solid var(--line);
      border-radius:var(--radius);
      background:
        linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0)),
        var(--panel);
      box-shadow:var(--shadow)
    }
    .card{
      padding:0;
      border:0;
      background:transparent;
      box-shadow:none;
    }
    .hero{
      position:relative;
      overflow:hidden;
      padding:20px;
      display:grid;
      gap:18px;
      isolation:isolate;
    }
    .hero::before{
      content:"";
      position:absolute;
      inset:-20% -10% auto 45%;
      height:240px;
      background:radial-gradient(circle, rgba(255,178,36,.22), rgba(255,178,36,0) 62%);
      pointer-events:none;
      filter:blur(10px);
      z-index:0;
    }
    .hero-top,.row,.head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;position:relative;z-index:1}
    .eyebrow,.pill,.badge{display:inline-flex;align-items:center;gap:8px;border-radius:999px;font-size:12px;font-weight:700}
    .eyebrow{
      padding:7px 12px;
      border:1px solid var(--line);
      background:rgba(255,255,255,.58);
      color:var(--ink-soft);
      text-transform:uppercase;
      letter-spacing:.12em;
      backdrop-filter:blur(12px);
    }
    .eyebrow-dot{width:7px;height:7px;border-radius:999px;background:linear-gradient(180deg,var(--gold),var(--peach));box-shadow:0 0 0 4px rgba(255,178,36,.12)}
    h1{margin:8px 0 4px;font-size:clamp(30px,4vw,40px);line-height:.96;letter-spacing:-.055em;max-width:11ch}
    h2{margin:0 0 6px;font-size:17px;letter-spacing:-.02em}
    p{margin:0;color:var(--muted);font-size:14px;line-height:1.58}
    .status{
      padding:9px 12px;
      border:1px solid var(--line);
      background:rgba(255,255,255,.56);
      backdrop-filter:blur(14px);
      color:var(--ink-soft);
    }
    .status::before{content:"";width:8px;height:8px;border-radius:999px;background:var(--amber);box-shadow:0 0 0 4px var(--amber-soft)}
    .status[data-tone="ok"]::before{background:var(--mint);box-shadow:0 0 0 4px var(--mint-soft)}
    .status[data-tone="err"]::before{background:var(--rose);box-shadow:0 0 0 4px var(--rose-soft)}
    .status[data-tone="info"]::before{background:var(--sky);box-shadow:0 0 0 4px var(--sky-soft)}
    .steps,.grid,.summary,.layout,.hero-shell,.journey-track,.story-grid{display:grid;gap:12px}.step{padding:18px}.summary strong,.timeline strong,.list strong,.story-card strong,.journey-panel strong{display:block}
    .hero-shell{grid-template-columns:1fr;align-items:start}
    .hero-copy{display:grid;gap:14px}
    .hero-copy p{max-width:56ch}
    .journey-panel{padding:0;border:0;border-radius:0;background:transparent}
    .journey-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px;padding:5px 10px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .journey-kicker::before{content:"";width:7px;height:7px;border-radius:999px;background:var(--sky)}
    .journey-stage{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;background:var(--panel);border:1px solid var(--line);color:var(--ink-soft);font-size:12px;font-weight:700}
    .journey-stage::before{content:"";width:8px;height:8px;border-radius:999px;background:var(--amber)}
    .journey-panel h2{margin-top:14px;font-size:26px;line-height:1.06;letter-spacing:-.04em}
    .journey-panel p{color:var(--ink-soft)}
    .journey-meter{position:relative;height:8px;margin-top:14px;border-radius:999px;background:var(--line);overflow:hidden}
    .journey-meter span{display:block;height:100%;width:18%;border-radius:inherit;background:var(--ink);transition:width .18s ease-out}
    .journey-next{margin-top:6px;padding:0;border:0;border-radius:0;background:transparent;font-size:14px;color:var(--ink-soft)}
    .journey-track{margin-top:6px;grid-template-columns:1fr;gap:0;border-top:1px solid var(--line)}
    .journey-node{position:relative;padding:12px 0 12px 38px;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;min-height:auto}
    .journey-node:last-child{border-bottom:0}
    .journey-node .node-index{position:absolute;left:0;top:12px;display:inline-grid;place-items:center;width:24px;height:24px;border-radius:999px;border:1px solid var(--line);font-size:11px;font-weight:800;color:var(--muted);background:var(--panel)}
    .journey-node strong{margin-top:0;font-size:13px}
    .journey-node p{margin-top:4px;font-size:12px;line-height:1.45}
    .journey-node[data-state="done"]{background:transparent;border-color:var(--line)}
    .journey-node[data-state="done"] .node-index{background:var(--mint);color:#fff;border-color:var(--mint)}
    .journey-node[data-state="active"]{background:transparent;border-color:var(--line)}
    .journey-node[data-state="active"] .node-index{background:var(--sky);color:#fff;border-color:var(--sky)}
    .journey-node[data-state="failed"]{background:transparent;border-color:var(--line)}
    .journey-node[data-state="failed"] .node-index{background:var(--rose);color:#fff;border-color:var(--rose)}
    .story-grid{grid-template-columns:1fr}
    .story-card{padding:12px 0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent}
    .story-card:last-child{border-bottom:0}
    .story-card span{display:block;margin-bottom:6px;color:var(--muted);font-size:11px;letter-spacing:.07em;text-transform:uppercase;font-weight:800}
    .focus-card{padding:0;border:0;border-radius:0;background:transparent;display:grid;gap:14px}
    .focus-card h3{margin:0;font-size:22px;line-height:1.08;letter-spacing:-.03em}
    .focus-card p{color:var(--ink-soft)}
    .focus-card[data-kind="overview"],.focus-card[data-kind="guidance"],.focus-card[data-kind="capabilities"],.focus-card[data-kind="drafts"]{background:transparent}
    .focus-meta{display:flex;gap:18px;flex-wrap:wrap;align-items:baseline}
    .focus-meta .box{
      padding:0;
      border:0;
      border-radius:0;
      background:transparent;
      min-width:0;
      transform:none;
      transition:none;
    }
    .focus-meta .box:hover{transform:none;border-color:transparent}
    .focus-meta .label{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
    .focus-meta strong{font-size:18px;letter-spacing:-.03em}
    .vibe-list{display:grid;gap:0}
    .vibe-item{padding:12px 0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent}
    .vibe-item:last-child{border-bottom:0}
    .vibe-item strong{display:block;margin-bottom:4px}
    .vibe-item p{font-size:13px}
    .mini-badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    .soft-note{padding:12px 0;border:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);border-radius:0;background:transparent;color:var(--ink-soft)}
    .soft-note strong{display:block;margin-bottom:5px}
    .detail-copy{padding:0 16px 4px;color:var(--muted);font-size:12px;line-height:1.55}
    .detail-block{display:grid;gap:14px}
    .layout{margin-top:20px;grid-template-columns:1fr}.stack{display:grid;gap:22px}.summary{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:14px}.summary .box,.surface,.callout,.empty,.list-item{padding:0;border:0;border-radius:0;background:transparent}.summary .label{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
    .field-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}.field.full{grid-column:1/-1}label{display:block;margin-bottom:7px;color:var(--muted);font-size:12px;font-weight:700}
    input,textarea,button{font:inherit}input,textarea{width:100%;padding:12px 13px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--ink)}textarea{min-height:136px;resize:vertical}input:focus,textarea:focus{outline:none;border-color:var(--sky);box-shadow:0 0 0 3px rgba(51,92,255,.14)}
    .segmented,.actions,.badges,.links,.timeline,.list{display:flex;gap:8px;flex-wrap:wrap}.actions{margin-top:16px}.segmented button,.actions button{appearance:none;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,opacity .15s ease}
    .segmented button{padding:10px 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:13px;font-weight:700}.segmented button.active{background:var(--sky-soft);color:var(--ink);border-color:var(--line-strong)}
    .actions button{
      padding:12px 16px;
      border-radius:14px;
      border:1px solid var(--line);
      font-size:13px;
      font-weight:800;
      background:var(--panel);
      color:var(--ink);
      box-shadow:0 8px 18px rgba(0,0,0,.06);
    }
    .actions .primary{
      background:linear-gradient(135deg,var(--gold),var(--peach));
      border-color:transparent;
      color:#24160c;
      box-shadow:0 12px 28px rgba(255,156,102,.26);
    }
    .actions .secondary{
      background:rgba(255,255,255,.58);
      color:var(--ink);
      backdrop-filter:blur(12px);
    }
    .actions .tertiary{background:transparent;color:var(--muted);border-style:dashed}
    button:hover{transform:translateY(-1px) scale(1.01)}
    button:disabled{opacity:.48;transform:none;box-shadow:none;cursor:not-allowed}
    button[hidden]{display:none!important}
    .badge{
      padding:8px 12px;
      border:1px solid var(--line);
      background:rgba(255,255,255,.56);
      color:var(--ink-soft);
      backdrop-filter:blur(12px)
    }
    .badge[data-tone="ok"]{color:var(--mint);background:var(--mint-soft)}
    .badge[data-tone="warn"]{color:var(--amber);background:var(--amber-soft)}
    .badge[data-tone="err"]{color:var(--rose);background:var(--rose-soft)}
    .badge[data-tone="info"]{color:var(--sky);background:var(--sky-soft)}
    .surface{margin-top:10px;padding-top:4px}.timeline{display:grid;gap:0;margin-top:4px}.timeline .item{display:grid;grid-template-columns:28px minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}.timeline .item:last-child{border-bottom:0}.dot{width:28px;height:28px;border-radius:999px;border:1px solid var(--line);display:grid;place-items:center;background:rgba(255,255,255,.9);font-size:12px;font-weight:700;color:var(--muted)}.item[data-state="done"] .dot{background:var(--mint);color:#fff;border-color:var(--mint)}.item[data-state="active"] .dot{background:var(--sky);color:#fff;border-color:var(--sky)}.item[data-state="failed"] .dot{background:var(--rose);color:#fff;border-color:var(--rose)}
    .callout{padding:12px 0 14px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
    .callout[data-tone="ok"]{background:transparent}.callout[data-tone="err"]{background:transparent}.callout[data-tone="warn"]{background:transparent}
    .helper{margin-top:6px;color:var(--muted);font-size:12px;line-height:1.5}.empty{color:var(--muted);padding:12px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.list-item{padding:12px 0;border-bottom:1px solid var(--line)}.list-item:last-child{border-bottom:0}.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}.file-pill{margin-top:10px;padding:9px 12px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.84);display:inline-flex;gap:8px;font-size:12px;font-weight:700}
    details{margin-top:14px;border:1px dashed var(--line-strong);border-radius:14px;background:var(--panel);overflow:hidden}summary{cursor:pointer;list-style:none;padding:14px 16px;color:var(--muted);font-size:13px;font-weight:700}summary::-webkit-details-marker{display:none}.details{padding:0 16px 16px}pre{margin:0;padding:14px;border-radius:12px;background:#0f1115;color:#f4f4f5;white-space:pre-wrap;word-break:break-word;max-height:320px;overflow:auto}
    html[data-theme="dark"] pre{background:#0c0d10;color:#f4f4f5}
    .intro{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);border-radius:0;background:transparent}.intro strong{display:block;margin-bottom:4px}.intro-mark{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--sky-soft);font-size:16px}
    .host-note{font-size:12px;color:var(--muted)}
    .collapsed-card details{margin-top:0;border:0;background:transparent}
    .collapsed-card summary{padding:0 0 12px}
    html[data-display-mode="sidebar"] .layout{grid-template-columns:1fr}
    .links a{color:var(--sky);text-decoration:none;font-size:13px;font-weight:700}
    .stack > .card{border-top:1px solid var(--line);padding-top:18px}
    @media (prefers-reduced-motion:no-preference){
      .hero,.card{animation:fadeUp .28s cubic-bezier(.2,.8,.2,1) both}
      .card:nth-of-type(2){animation-delay:.04s}
      .card:nth-of-type(3){animation-delay:.08s}
      .card:nth-of-type(4){animation-delay:.12s}
      .focus-meta .box,.vibe-item,.journey-node{animation:fadeLift .36s cubic-bezier(.2,.8,.2,1) both}
      .journey-track .journey-node:nth-child(2){animation-delay:.05s}
      .journey-track .journey-node:nth-child(3){animation-delay:.1s}
      .journey-track .journey-node:nth-child(4){animation-delay:.15s}
      .actions .primary{animation:pulseGlow 2.8s ease-in-out infinite}
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeLift{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes pulseGlow{0%,100%{box-shadow:0 12px 28px rgba(255,156,102,.22)}50%{box-shadow:0 16px 36px rgba(255,178,36,.34)}}
    }
    @media (max-width:960px){.layout,.summary,.hero-shell,.story-grid{grid-template-columns:1fr}.focus-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field-grid{grid-template-columns:1fr 1fr}}
    @media (max-width:640px){.field-grid{grid-template-columns:1fr}.actions{flex-direction:column}.actions button{width:100%}}
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div class="hero-top">
        <div>
          <div class="eyebrow"><span class="eyebrow-dot"></span>Vibecodr.Space</div>
          <h1 id="journeyTitle">Waiting for the creation package.</h1>
          <p id="journeyCopy">ChatGPT will guide the launch once it has the real app. The widget should stay quiet until there is something real to publish.</p>
          <div class="journey-next" id="journeyNext">Next: hand over the app or keep the conversation in ChatGPT.</div>
          <div class="host-note" id="hostNote">A compact launch surface for inline publishing inside ChatGPT.</div>
        </div>
        <div class="status pill" id="authStatus" data-tone="info">Ready inside ChatGPT</div>
      </div>
      <div class="focus-meta" style="margin-top:6px">
        <div class="box"><span class="label">Title</span><strong id="summaryTitle">Waiting for creation</strong></div>
        <div class="box"><span class="label">Runner</span><strong id="summaryRunner">-</strong></div>
        <div class="box"><span class="label">Files</span><strong id="summaryFiles">0 files</strong></div>
      </div>
      <div class="badges" id="authBadges" style="margin-top:12px"></div>
      <div class="journey-track" id="journeyTrack" style="margin-top:14px"></div>
      <div hidden aria-hidden="true">
        <span id="journeyStage"></span>
        <span id="journeyMeter"></span>
        <strong id="journeyMomentTitle"></strong>
        <p id="journeyMomentCopy"></p>
        <strong id="journeyPromptTitle"></strong>
        <p id="journeyPromptCopy"></p>
      </div>
    </section>

    <div class="layout">
      <main class="stack">
        <section class="card" id="publishCard" hidden>
          <div class="head"><div><h2>Publish this app</h2><p>A small launch surface: one decisive publish action, one optional polish pass.</p></div></div>
          <div class="soft-note"><strong>Launch intent</strong>Publish the app as a live vibe on the timeline. After that, the flow should pivot to sharing, remixing, and engagement.</div>
          <div class="actions">
            <button id="quickPublishBtn" class="primary">Launch on Vibecodr</button>
            <button id="polishToggleBtn" class="secondary">Polish first</button>
          </div>
          <input id="sourceType" type="hidden" value="chatgpt_v1" />
          <input id="importMode" type="hidden" value="direct_files" />
          ${packageSection}
        </section>

        <section class="card" id="insightCard" hidden>
          <div class="head"><div><h2 id="insightTitle">Vibecodr insight</h2><p id="insightIntro">The widget can explain the platform, guide the publish path, and summarize readiness without dropping into raw internals.</p></div></div>
          <div class="focus-card" id="insightSurface" data-kind="overview">
            <div>
              <div class="eyebrow" style="width:max-content;"><span class="eyebrow-dot"></span><span id="insightKicker">Platform</span></div>
              <h3 id="insightHeadline">Vibecodr turns apps into vibes.</h3>
              <p id="insightCopy">This surface can switch between overview, guidance, capability, and draft states.</p>
            </div>
            <div class="vibe-list" id="insightBody"></div>
            <div class="actions" id="insightActions"></div>
          </div>
        </section>

        <section class="card collapsed-card" id="polishCard" hidden>
          <div class="head"><div><h2>Optional finishing touches</h2><p>Visibility, thumbnail, and SEO should feel like launch polish, not setup tax. Most runs should not need every field here.</p></div></div>
          <input id="publishVisibility" type="hidden" value="public" />
          <details id="polishDetails">
            <summary>Open launch polish</summary>
            <div class="detail-copy">Use this when the AI still needs a visibility choice, cover image, or preview copy before the vibe goes live.</div>
            <div class="details detail-block">
              <div class="field-grid">
                <div class="field">
                  <label>Visibility</label>
                  <div class="segmented">
                    <button type="button" class="active" data-group="publishVisibility" data-value="public">Public</button>
                    <button type="button" data-group="publishVisibility" data-value="unlisted">Unlisted</button>
                    <button type="button" data-group="publishVisibility" data-value="private">Private</button>
                  </div>
                </div>
                <div class="field">
                  <label for="coverKey">Existing cover key</label>
                  <input id="coverKey" placeholder="Optional pre-uploaded key" />
                </div>
                <div class="field full">
                  <label for="thumbnailFile">Thumbnail image</label>
                  <input id="thumbnailFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" />
                  <div class="helper">Accepted: png, jpeg, webp, avif, gif. Max 5 MB.</div>
                  <div class="file-pill" id="thumbnailMeta">No thumbnail selected yet</div>
                </div>
                <div class="field">
                  <label for="seoTitle">SEO title</label>
                  <input id="seoTitle" placeholder="Optional title for previews" />
                </div>
                <div class="field">
                  <label for="seoDescription">SEO description</label>
                  <input id="seoDescription" placeholder="Optional one-line summary" />
                </div>
              </div>
              <details>
                <summary>Advanced social metadata</summary>
                <div class="details">
                  <div class="field-grid">
                    <div class="field"><label for="seoImageKey">SEO image key</label><input id="seoImageKey" placeholder="Optional image key override" /></div>
                    <div class="field"><label for="ogTitle">Open Graph title</label><input id="ogTitle" placeholder="Optional override" /></div>
                    <div class="field"><label for="ogDescription">Open Graph description</label><input id="ogDescription" placeholder="Optional override" /></div>
                    <div class="field"><label for="twitterTitle">Twitter title</label><input id="twitterTitle" placeholder="Optional override" /></div>
                    <div class="field"><label for="twitterDescription">Twitter description</label><input id="twitterDescription" placeholder="Optional override" /></div>
                  </div>
                </div>
              </details>
            </div>
          </details>
        </section>
      </main>

      <aside class="stack">
        <section class="card" id="liveStoryCard" hidden>
          <div class="head"><div><h2>Live publish story</h2><p>A single running narrative of the launch, not an operator console.</p></div></div>
          <div id="statusHero" class="empty">No operation yet. Connect your account once and ChatGPT can guide the rest of the publish flow from here.</div>
          <div class="surface">
            <div class="badges" id="statusBadges"></div>
            <div class="timeline" id="timeline"></div>
            <div class="links" id="statusLinks" style="margin-top:14px;"></div>
          </div>
          ${liveControlsSection}
        </section>

        <section class="card" id="nextStepsCard" hidden>
          <div class="head"><div><h2>What happens next</h2><p>Guidance should read like editorial next steps, not a dashboard task list.</p></div></div>
          <div id="recommendations" class="empty">Once a tool runs, recommendations will appear here.</div>
          <div id="diagnostics" class="list"></div>
        </section>

        ${recoverySection}
      </aside>
    </div>
  </div>

  <script>
    const APP_BASE_URL = ${JSON.stringify(appBaseUrl.replace(/\/+$/, ""))};
    const APP_BASE_ORIGIN = new URL(APP_BASE_URL).origin;
    const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
    const MAX_INLINE_THUMBNAIL_BYTES = 900 * 1024;
    const ALLOWED_THUMBNAIL_MIME = new Set(["image/png","image/jpeg","image/webp","image/avif","image/gif"]);
    const STATUS_LABELS = {received:"Received",validating:"Validating",normalized:"Normalizing",ingesting:"Importing",waiting_on_import_job:"Waiting on import job",draft_ready:"Draft ready",compile_running:"Compiling",compile_failed:"Compile failed",publish_running:"Publishing",published:"Published",published_with_warnings:"Published with warnings",failed:"Failed",canceled:"Canceled"};
    const STATUS_TONES = {received:"info",validating:"info",normalized:"info",ingesting:"info",waiting_on_import_job:"warn",draft_ready:"ok",compile_running:"info",compile_failed:"err",publish_running:"info",published:"ok",published_with_warnings:"warn",failed:"err",canceled:"warn"};
    const TIMELINE = [{k:"connect",label:"Connected",detail:"Link your account before publish-scoped actions."},{k:"import",label:"Imported",detail:"Creation files become a Vibecodr draft capsule."},{k:"compile",label:"Compiled",detail:"Optional quality pass before release."},{k:"publish",label:"Published",detail:"Launch the vibe and attach its metadata."}];
    const state = { session:null, operation:null, recommendations:[], diagnostics:[], links:[], authPrompt:false, insight:null, packagePayload:null };
    const query = new URLSearchParams(window.location.search);
    const uiState = { advancedMode: query.get("advanced")==="1", polishOpen: query.get("polish")==="1", hostConnected:false, payloadReady:false };
    const hostSync = { lastSnapshot:"", pendingMutationSnapshot:"", scheduled:false, pollTimer:null };
    const $ = (id) => document.getElementById(id);
    const refs = { authStatus:$("authStatus"), authBadges:$("authBadges"), payload:$("payload"), out:$("out"), statusHero:$("statusHero"), statusBadges:$("statusBadges"), timeline:$("timeline"), recommendations:$("recommendations"), diagnostics:$("diagnostics"), statusLinks:$("statusLinks"), operationId:$("operationId"), capsuleId:$("capsuleId"), thumbnailFile:$("thumbnailFile"), thumbnailMeta:$("thumbnailMeta"), oauthBtn:$("oauthBtn"), logoutBtn:$("logoutBtn"), importBtn:$("importBtn"), quickPublishBtn:$("quickPublishBtn"), polishToggleBtn:$("polishToggleBtn"), watchBtn:$("watchBtn"), compileBtn:$("compileBtn"), publishBtn:$("publishBtn"), getOpBtn:$("getOpBtn"), explainFailureBtn:$("explainFailureBtn"), cancelBtn:$("cancelBtn"), listBtn:$("listBtn"), listDraftsBtn:$("listDraftsBtn"), summaryTitle:$("summaryTitle"), summaryRunner:$("summaryRunner"), summaryFiles:$("summaryFiles"), journeyStage:$("journeyStage"), journeyTitle:$("journeyTitle"), journeyCopy:$("journeyCopy"), journeyNext:$("journeyNext"), journeyMeter:$("journeyMeter"), journeyTrack:$("journeyTrack"), journeyMomentTitle:$("journeyMomentTitle"), journeyMomentCopy:$("journeyMomentCopy"), journeyPromptTitle:$("journeyPromptTitle"), journeyPromptCopy:$("journeyPromptCopy"), connectCard:$("connectCard"), publishCard:$("publishCard"), insightCard:$("insightCard"), insightTitle:$("insightTitle"), insightIntro:$("insightIntro"), insightSurface:$("insightSurface"), insightKicker:$("insightKicker"), insightHeadline:$("insightHeadline"), insightCopy:$("insightCopy"), insightBody:$("insightBody"), insightActions:$("insightActions"), polishCard:$("polishCard"), liveStoryCard:$("liveStoryCard"), nextStepsCard:$("nextStepsCard"), recoveryCard:$("recoveryCard"), packageDetails:$("packageDetails"), polishDetails:$("polishDetails"), liveControls:$("liveControls"), recoveryDetails:$("recoveryDetails") };
    function esc(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;")}
    function badge(text,tone){return '<span class="badge" data-tone="'+esc(tone||"info")+'">'+esc(text)+'</span>'}
    function statusLabel(status){return STATUS_LABELS[status] || status || "Pending"}
    function statusTone(status){return STATUS_TONES[status] || "info"}
    function diagnosticTitle(item){if(item&&typeof item==="object"){if(item.stage==="compile") return "Compile check"; if(item.stage==="publish") return "Launch update"; if(item.stage==="ingest"||item.stage==="import_job") return "Draft creation";} return "Launch note"}
    function value(id){return $(id).value}
    function on(el,event,handler){if(el) el.addEventListener(event,handler)}
    function formatTime(v){if(!v)return ""; try{return new Date(v).toLocaleString()}catch{return ""}}
    function setSegment(group,val){document.querySelectorAll('[data-group="'+group+'"]').forEach((b)=>b.classList.toggle("active",b.dataset.value===val)); $(group).value = val}
    document.querySelectorAll("[data-group]").forEach((button)=>button.addEventListener("click",()=>setSegment(button.dataset.group,button.dataset.value)));
    function setOutput(data){refs.out.textContent = typeof data === "string" ? data : JSON.stringify(data,null,2)}
    function parseJson(text,label){try{return {ok:true,value:JSON.parse(text)}}catch{renderCallout("err",label,"The JSON is not valid yet. Fix it before running the action."); return {ok:false,value:null}}}
    function parseJsonSilently(text){try{return JSON.parse(text)}catch{return null}}
    function currentPayloadText(){if(refs.payload&&typeof refs.payload.value==="string"&&refs.payload.value.trim()) return refs.payload.value.trim(); if(state.packagePayload&&typeof state.packagePayload==="object") return JSON.stringify(state.packagePayload); return "";}
    function summarizePackage(){const raw=currentPayloadText(); if(!raw){uiState.payloadReady=false; refs.summaryTitle.textContent="Waiting for creation"; refs.summaryRunner.textContent="-"; refs.summaryFiles.textContent="0 files"; return;} const parsed=parseJsonSilently(raw); if(!parsed||!Array.isArray(parsed.files)||parsed.files.length===0){uiState.payloadReady=false; refs.summaryTitle.textContent="Waiting for a valid creation"; refs.summaryRunner.textContent="-"; refs.summaryFiles.textContent="0 files"; return;} const count=parsed.files.length; uiState.payloadReady=true; refs.summaryTitle.textContent=parsed.title||"Untitled vibe"; refs.summaryRunner.textContent=parsed.runner||"client-static"; refs.summaryFiles.textContent=count + (count===1?" file":" files")}
    function normalizeResult(raw){if(!raw||typeof raw!=="object") return raw; return raw.result && typeof raw.result==="object" ? raw.result : raw}
    function absoluteAppUrl(path){return APP_BASE_URL + (path.startsWith("/") ? path : "/" + path)}
    function hasHostBridge(){return Boolean(window.openai&&typeof window.openai==="object")}
    function canProbeCookieSession(){return !hasHostBridge()||window.location.origin===APP_BASE_ORIGIN}
    function readHostSnapshot(){if(!(window.openai&&typeof window.openai==="object")) return ""; try{return JSON.stringify({toolInput:window.openai.toolInput||null,toolOutput:window.openai.toolOutput||null,toolResponseMetadata:window.openai.toolResponseMetadata||null,widgetState:window.openai.widgetState||null})}catch{return "unserializable-host-state"}}
    function clearHostMutationWatch(){hostSync.pendingMutationSnapshot=""}
    function beginHostMutationWatch(){hostSync.pendingMutationSnapshot=readHostSnapshot()}
    function startHostPolling(){if(hostSync.pollTimer||!hasHostBridge()) return; hostSync.pollTimer=window.setInterval(()=>scheduleHostSync(),700)}
    function stopHostPolling(){if(hostSync.pollTimer){window.clearInterval(hostSync.pollTimer); hostSync.pollTimer=null}}
    function isFailureState(status){return status==="failed"||status==="compile_failed"}
    function isConnected(){return Boolean((state.session&&state.session.authenticated)||uiState.hostConnected)}
    function shouldPromptForConnection(){return !isConnected()&&(state.authPrompt||uiState.advancedMode)}
    function markHostConnected(userId){uiState.hostConnected=true; state.authPrompt=false; if(!state.session||!state.session.authenticated){state.session={authenticated:true,userId:userId||"ChatGPT-linked account",provider:${JSON.stringify(providerName)},authMode:"host_oauth"}}}
    function toggle(el, show){if(el) el.hidden=!show}
    function collapse(el){if(el&&"open" in el) el.open=false}
    function updateSurfaceVisibility(){const connected=isConnected(); const op=state.operation; const hasFailure=Boolean(op&&isFailureState(op.status)); const advanced=uiState.advancedMode; const needsConnection=shouldPromptForConnection(); const hasPayload=uiState.payloadReady||advanced; const shouldShowPolish=connected&&(advanced||uiState.polishOpen||(op&&["draft_ready","publish_running","published","published_with_warnings"].includes(op.status))); toggle(refs.connectCard, needsConnection); toggle(refs.publishCard, connected||advanced); toggle(refs.insightCard, Boolean(state.insight)); toggle(refs.polishCard, shouldShowPolish); toggle(refs.liveStoryCard, connected||hasFailure||advanced||!needsConnection); toggle(refs.nextStepsCard, connected||hasFailure||advanced||!needsConnection); toggle(refs.packageDetails, advanced); toggle(refs.liveControls, advanced); toggle(refs.recoveryCard, advanced); if(refs.quickPublishBtn){refs.quickPublishBtn.disabled=!hasPayload} if(refs.polishToggleBtn){refs.polishToggleBtn.disabled=!hasPayload} if(!advanced){collapse(refs.packageDetails); collapse(refs.liveControls); collapse(refs.recoveryDetails)} if(!shouldShowPolish){collapse(refs.polishDetails)} if(shouldShowPolish&&uiState.polishOpen&&refs.polishDetails){refs.polishDetails.open=true}}
    async function mcpCall(name,args){if(window.openai&&typeof window.openai.callTool==="function") return normalizeResult(await window.openai.callTool(name,args||{})); const res=await fetch(absoluteAppUrl("/mcp"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:Date.now(),method:"tools/call",params:{name,arguments:args||{}}})}); const data=await res.json(); return normalizeResult(data.result||data)}
    async function apiCall(path,init){const res=await fetch(absoluteAppUrl(path),{credentials:"same-origin",...(init||{})}); const contentType=res.headers.get("content-type")||""; const data=contentType.includes("application/json")?await res.json():await res.text(); return {ok:res.ok,status:res.status,data}}
    async function fileToBase64(file){const buf=await file.arrayBuffer(); const bytes=new Uint8Array(buf); const chunk=0x8000; let binary=""; for(let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i,i+chunk)); return btoa(binary)}
    function extractUploadedFileId(payload){if(typeof payload==="string"&&payload.trim()) return payload.trim(); if(payload&&typeof payload==="object"){if(typeof payload.fileId==="string"&&payload.fileId.trim()) return payload.fileId.trim(); if(typeof payload.id==="string"&&payload.id.trim()) return payload.id.trim()} return ""}
    function extractDownloadUrl(payload){if(typeof payload==="string"&&payload.trim()) return payload.trim(); if(payload&&typeof payload==="object"){if(typeof payload.downloadUrl==="string"&&payload.downloadUrl.trim()) return payload.downloadUrl.trim(); if(typeof payload.url==="string"&&payload.url.trim()) return payload.url.trim(); if(typeof payload.href==="string"&&payload.href.trim()) return payload.href.trim()} return ""}
    async function buildThumbnailInput(){const file=refs.thumbnailFile.files&&refs.thumbnailFile.files[0]?refs.thumbnailFile.files[0]:null; if(!file) return undefined; const mime=(file.type||"").toLowerCase(); if(!ALLOWED_THUMBNAIL_MIME.has(mime)){renderCallout("err","Thumbnail rejected","Use png, jpeg, webp, avif, or gif for the cover image."); return null} if(file.size>MAX_THUMBNAIL_BYTES){renderCallout("err","Thumbnail too large","Keep the image under 5 MB."); return null} if(window.openai&&typeof window.openai.uploadFile==="function"&&typeof window.openai.getFileDownloadUrl==="function"){try{const uploadResult=await window.openai.uploadFile(file); const fileId=extractUploadedFileId(uploadResult); if(fileId){const downloadResult=await window.openai.getFileDownloadUrl({fileId}); const downloadUrl=extractDownloadUrl(downloadResult); if(downloadUrl){return {thumbnailFile:{fileId,downloadUrl,contentType:file.type||"application/octet-stream",...(file.name?{fileName:file.name}:{} )}}}}}catch{} } if(file.size>MAX_INLINE_THUMBNAIL_BYTES){renderCallout("warn","Thumbnail upload needs the hosted file path","This image is too large for the inline MCP fallback. Keep the raw file under 900 KB or retry with ChatGPT file upload support."); return null} return {thumbnailUpload:{contentType:file.type||"application/octet-stream",fileName:file.name,fileBase64:await fileToBase64(file)}}}
    function buildSeo(){const base={}; [["title","seoTitle"],["description","seoDescription"],["imageKey","seoImageKey"]].forEach(([k,id])=>{const v=$(id).value.trim(); if(v) base[k]=v}); const ogTitle=$("ogTitle").value.trim(), ogDescription=$("ogDescription").value.trim(); if(ogTitle||ogDescription){base.og={}; if(ogTitle) base.og.title=ogTitle; if(ogDescription) base.og.description=ogDescription} const twTitle=$("twitterTitle").value.trim(), twDescription=$("twitterDescription").value.trim(); if(twTitle||twDescription){base.twitter={}; if(twTitle) base.twitter.title=twTitle; if(twDescription) base.twitter.description=twDescription} return Object.keys(base).length ? base : undefined}
    function renderCallout(tone,title,body){refs.statusHero.className="callout"; refs.statusHero.dataset.tone=tone; refs.statusHero.innerHTML="<strong>"+esc(title)+"</strong><div>"+esc(body)+"</div>"}
    function renderAuth(){if(refs.authBadges) refs.authBadges.innerHTML=""; const s=state.session; const connected=isConnected(); const needsConnection=shouldPromptForConnection(); if(!connected){refs.authStatus.dataset.tone=needsConnection?"warn":"info"; refs.authStatus.textContent=needsConnection?"Authentication handled by your client":"Ready inside ChatGPT"; if(refs.authBadges) refs.authBadges.innerHTML=needsConnection?badge("A publish action will trigger login when needed","warn"):badge("No extra setup needed yet","info"); updateSurfaceVisibility(); return} refs.authStatus.dataset.tone="ok"; refs.authStatus.textContent="Connected"; if(refs.authBadges) refs.authBadges.innerHTML=badge("Publish enabled","ok")+(s&&s.expiresAt?badge("Expires "+formatTime(s.expiresAt),"info"):""); updateSurfaceVisibility()}
    function trackStatesFor(op, connected, needsConnection){return TIMELINE.map((step)=>{if(step.k==="connect") return connected?"done":needsConnection?"active":"pending"; if(!op) return "pending"; if(step.k==="import") return op.status==="failed"&&op.currentStage!=="publish_running"?"failed":["draft_ready","compile_running","compile_failed","publish_running","published","published_with_warnings"].includes(op.status)?"done":["validating","normalized","ingesting","waiting_on_import_job","received"].includes(op.status)?"active":"pending"; if(step.k==="compile") return op.status==="compile_failed"?"failed":op.currentStage==="compiled"||op.status==="published"||op.status==="published_with_warnings"?"done":op.status==="compile_running"?"active":"pending"; if(step.k==="publish") return op.status==="published"||op.status==="published_with_warnings"?"done":op.status==="failed"&&op.currentStage==="failed"?"failed":op.status==="publish_running"?"active":"pending"; return "pending"})}
    function computeJourney(){const op=state.operation; const connected=isConnected(); const needsConnection=shouldPromptForConnection(); const states=trackStatesFor(op,connected,needsConnection); let tone="info", stage="Ready inside ChatGPT", title="ChatGPT can explain, prep, and publish from here.", copy="Vibecodr is the social platform where apps become live vibes that run on the feed, can be remixed like forks, commented on, liked, and shared by URL.", next="Next: ask about the app, or start a publish run when you want to turn the conversation into a launch.", momentTitle="The launch assistant is standing by", momentCopy="The connection step should only appear when the conversation actually reaches a publish action.", promptTitle="Keep the flow product-first", promptCopy="Explain what Vibecodr does, or move into publish only when the user asks for a live launch.", progress=12;
      if(needsConnection){tone="warn"; stage="Awaiting connection"; title="Authentication will happen when publish is requested."; copy="The widget does not need a separate sign-in step. Your MCP client or ChatGPT app will trigger login when a protected action actually needs it."; next="Next: keep the conversation moving until a real publish action is confirmed."; momentTitle="Authentication is deferred"; momentCopy="The UI should stay focused on the app, not on login furniture."; promptTitle="Ask only for missing launch details"; promptCopy="The model should keep the flow moving and let the client handle login when required."; progress=18;}
      if(connected){tone="ok"; stage="Ready to review"; title=uiState.payloadReady?"Ready to publish this app.":"Waiting for the creation package."; copy=uiState.payloadReady?"The app is here. ChatGPT can ask for any missing launch detail and publish when you confirm.":"The widget is waiting for the real app package from the host conversation."; next=uiState.payloadReady?"Next: publish now or open launch polish.":"Next: hand over the app before trying to launch it."; momentTitle=uiState.payloadReady?"App ready":"No app loaded yet"; momentCopy=uiState.payloadReady?"Keep the UI small and action-oriented.":"Stay inert until the host provides a real creation."; progress=uiState.payloadReady?34:24;}
      if(op){if(["received","validating","normalized","ingesting","waiting_on_import_job"].includes(op.status)){tone="info"; stage="Importing the creation"; title="The vibe is becoming a draft."; copy="Files are being normalized into a Vibecodr draft capsule so the launch path can keep moving without losing the conversation context."; next="Next: stay in the thread while the import completes. The AI should surface any blocking package issue in plain language."; momentTitle="The creation is entering Vibecodr"; momentCopy="This is the handoff from chat artifact to runnable draft. The user should feel progress, not plumbing."; promptTitle="Narrate the handoff"; promptCopy="Explain what is being prepared, not the implementation mechanics."; progress=52;}
        else if(op.status==="draft_ready"){tone="ok"; stage="Draft ready"; title="The vibe is staged for a launch."; copy="The draft exists, the package is in Vibecodr, and the flow can compile or publish depending on how much polish is needed."; next="Next: apply thumbnail and SEO polish, then publish. Compile only if the user wants the extra safety pass."; momentTitle="The draft is waiting backstage"; momentCopy="This is the best moment for the AI to ask for any missing cover image, SEO title, or visibility choice."; promptTitle="Collect the last launch details"; promptCopy="Ask only for missing decisions like visibility, thumbnail, or short description."; progress=68;}
        else if(op.status==="compile_running"){tone="info"; stage="Compiling"; title="The launch is being quality-checked."; copy="A compile pass is running so the app can be shipped with more confidence before it hits the timeline."; next="Next: stay on the thread and report whether the compile clears or needs a fix."; momentTitle="Quality pass in motion"; momentCopy="This is a reassurance moment. The user should understand the app is being checked, not stalled."; promptTitle="Translate compiler feedback"; promptCopy="If the compile fails, summarize the root issue and propose the narrowest useful fix."; progress=78;}
        else if(op.status==="publish_running"){tone="info"; stage="Publishing"; title="The vibe is on its way to the timeline."; copy="The final publish step is attaching the launch metadata and turning the draft into a live, shareable Vibecodr post."; next="Next: hold steady until the live URL is ready, then invite the user to share or remix it."; momentTitle="The app is crossing the finish line"; momentCopy="This is where the story should shift from build mechanics to launch energy."; promptTitle="Set up the celebration"; promptCopy="As soon as the publish clears, tell the user what is live and where it can be shared."; progress=90;}
        else if(op.status==="published"){tone="ok"; stage="Live on Vibecodr"; title="The vibe is published."; copy="The app is now live as a shareable Vibecodr post that can run on the timeline, be remixed, commented on, liked, and shared by URL."; next="Next: show the live link, describe what people can now do with it, and offer a remix or polish pass."; momentTitle="Launch complete"; momentCopy="The conversation should pivot from deployment to discovery: sharing, remixing, and iteration."; promptTitle="Close like a launch partner"; promptCopy="Celebrate briefly, surface the live link, and suggest the highest-value next move."; progress=100;}
        else if(op.status==="published_with_warnings"){tone="warn"; stage="Live, with follow-up needed"; title="The vibe is live, but launch polish still needs one follow-up step."; copy="The publish succeeded, but the cover image or SEO metadata did not finish applying. The app is shareable now, and ChatGPT should help finish the polish instead of pretending the launch was perfect."; next="Next: retry the cover image or SEO update, then confirm the final share preview looks right."; momentTitle="Launch polish is still open"; momentCopy="The social post exists, but the metadata pass needs one more guided update."; promptTitle="Stay in launch-polish mode"; promptCopy="Acknowledge that the vibe is live, then offer the smallest follow-up fix for cover art or SEO."; progress=94;}
        else if(op.status==="compile_failed"||op.status==="failed"){tone="err"; stage="Needs attention"; title="The journey hit a repair point."; copy="Something blocked the path. The AI should explain the issue in plain language, propose the smallest viable recovery, and keep the user oriented."; next="Next: summarize the blocker, confirm whether to retry, and avoid dumping raw internals unless the user asks."; momentTitle="A repair step is needed"; momentCopy="This should feel like guided recovery, not a dead end. The model needs to stay in control of the workflow."; promptTitle="Recover without shifting burden"; promptCopy="Explain the failure simply, then ask one concrete follow-up question if needed."; progress=62;}}
      return {tone,stage,title,copy,next,momentTitle,momentCopy,promptTitle,promptCopy,progress,states};}
    function extractLinks(operation){if(Array.isArray(operation?.links)){return operation.links.filter((x)=>x&&typeof x.href==="string"&&typeof x.label==="string")} const diagnostics=Array.isArray(operation?.diagnostics)?operation.diagnostics:[]; const links=[]; diagnostics.forEach((d)=>{const details=d&&typeof d.details==="object"?d.details:null; if(!details) return; if(typeof details.artifactUrl==="string"&&details.artifactUrl) links.push({label:"Artifact",href:details.artifactUrl}); if(typeof details.postUrl==="string"&&details.postUrl) links.push({label:"Live vibe",href:details.postUrl})}); const seen=new Set(); return links.filter((x)=>seen.has(x.href)?false:(seen.add(x.href),true))}
    function renderJourney(){const journey=computeJourney(); refs.journeyStage.dataset.tone=journey.tone; refs.journeyStage.textContent=journey.stage; refs.journeyTitle.textContent=journey.title; refs.journeyCopy.textContent=journey.copy; refs.journeyNext.textContent=journey.next; refs.journeyMomentTitle.textContent=journey.momentTitle; refs.journeyMomentCopy.textContent=journey.momentCopy; refs.journeyPromptTitle.textContent=journey.promptTitle; refs.journeyPromptCopy.textContent=journey.promptCopy; refs.journeyMeter.style.width=Math.max(12,Math.min(100,journey.progress))+"%"; refs.journeyTrack.innerHTML=TIMELINE.map((step,index)=>'<div class="journey-node" data-state="'+journey.states[index]+'"><div class="node-index">'+(journey.states[index]==="done"?"✓":journey.states[index]==="failed"?"!":String(index+1))+'</div><strong>'+esc(step.label)+'</strong><p>'+esc(step.detail)+'</p></div>').join("")}
    function renderRecommendations(){if(!state.recommendations.length){refs.recommendations.className="empty"; refs.recommendations.innerHTML="Tool guidance will appear here after import, readiness, or failure inspection runs."; return} refs.recommendations.className="list"; refs.recommendations.innerHTML=state.recommendations.map((x)=>'<div class="list-item"><strong>Next step</strong>'+esc(x)+'</div>').join("")}
    function renderDiagnostics(){refs.diagnostics.innerHTML=state.diagnostics.slice(0,5).map((x)=>'<div class="list-item"><strong>'+esc(diagnosticTitle(x))+'</strong>'+esc(x.message||"No diagnostic message")+(x.retryable?'<div class="helper">Retry available</div>':"")+'</div>').join("")}
    function renderLinks(){refs.statusLinks.innerHTML=state.links.map((x)=>'<a href="'+esc(x.href)+'" target="_blank" rel="noreferrer">'+esc(x.label)+'</a>').join("")}
    function miniBadge(text,tone){return '<span class="badge" data-tone="'+esc(tone||"info")+'">'+esc(text)+'</span>'}
    function renderInsight(){if(!state.insight){refs.insightBody.innerHTML=""; if(refs.insightActions){refs.insightActions.innerHTML=""; refs.insightActions.hidden=true} updateSurfaceVisibility(); return} const view=state.insight; refs.insightTitle.textContent=view.title; refs.insightIntro.textContent=view.intro; refs.insightSurface.dataset.kind=view.kind; refs.insightKicker.textContent=view.kicker; refs.insightHeadline.textContent=view.headline; refs.insightCopy.textContent=view.copy; refs.insightBody.innerHTML=view.items.join(""); renderInsightActions(view.actions||[]); updateSurfaceVisibility()}
    function renderTimeline(){const op=state.operation; const connected=isConnected(); const needsConnection=shouldPromptForConnection(); const states=trackStatesFor(op,connected,needsConnection); refs.timeline.innerHTML=TIMELINE.map((step,index)=>{let detail=step.detail; if(step.k==="connect"&&connected) detail="Account linked and ready for publish actions."; if(step.k==="connect"&&!connected&&!needsConnection) detail="Link your account only when the conversation turns into a publish action."; if(op&&step.k==="import"&&op.currentStage) detail="Current stage: "+op.currentStage; if(op&&step.k==="compile"&&op.currentStage==="compiled") detail="Draft compile finished."; if(op&&step.k==="publish"&&(op.status==="published"||op.status==="published_with_warnings")) detail=op.status==="published_with_warnings"?"Your vibe is live, but launch polish still needs a follow-up step.":"Your vibe has been published."; return '<div class="item" data-state="'+states[index]+'"><div class="dot">'+(states[index]==="done"?"✓":states[index]==="failed"?"!":String(index+1))+'</div><div><strong>'+esc(step.label)+'</strong><p>'+esc(detail)+'</p></div></div>'}).join("")}
    function syncOperationFields(op){if(!op) return; if(refs.operationId) refs.operationId.value=op.operationId||refs.operationId.value; if(refs.capsuleId) refs.capsuleId.value=op.capsuleId||refs.capsuleId.value}
    function renderOperation(){const op=state.operation; refs.statusBadges.innerHTML=""; if(!op){updateSurfaceVisibility(); renderJourney(); renderTimeline(); renderRecommendations(); renderDiagnostics(); renderLinks(); return} const label=statusLabel(op.status), tone=statusTone(op.status); renderCallout(tone,label,op.status==="published"?"The vibe has cleared the publish flow. Review links and metadata results below.":op.status==="published_with_warnings"?"The vibe is live, but the metadata pass still needs one follow-up update.":op.status==="draft_ready"?"The draft is ready for launch. Add polish if needed, then let ChatGPT publish it.":op.status==="failed"||op.status==="compile_failed"?"The launch needs a repair step. The advanced controls are now available below only because the guided flow hit a blocker.":"The publish flow is moving. Stay in the thread while ChatGPT keeps the launch on track."); refs.statusBadges.innerHTML=badge(label,tone)+badge(op.sourceType||"unknown","info")+(op.capsuleId?badge("Draft staged","ok"):"")+badge("Updated "+formatTime(op.updatedAt),"info"); state.links=extractLinks(op); updateSurfaceVisibility(); renderJourney(); renderTimeline(); renderRecommendations(); renderDiagnostics(); renderLinks(); syncOperationFields(op)}
    function applyStructuredContent(content){
      const data=content&&typeof content==="object"&&content.structuredContent?content.structuredContent:content;
      setOutput(data);
      if(data&&typeof data==="object"){
        if(data.authRequired===true){state.authPrompt=true}
        if(typeof data.name==="string"&&Array.isArray(data.socialFeatures)){
          state.insight={kind:"overview",title:"What Vibecodr is",intro:"This card explains the platform in a single visual beat so the chat does not have to fall back to raw tool output.",kicker:"Platform",headline:data.assistantAnswer||data.tagline||data.name,copy:data.summary||"",items:[
            '<div class="vibe-item"><strong>What people can do</strong><p>'+esc((data.socialFeatures||[]).join(" • "))+'</p></div>',
            '<div class="vibe-item"><strong>Creation flow</strong><p>'+esc((data.creationFlow||[]).join(" -> "))+'</p></div>'
          ]};
        }
        if(typeof data.goal==="string"&&Array.isArray(data.assistantBehavior)){
          state.insight={kind:"guidance",title:"Guided publish flow",intro:"The widget can now show the agent contract directly instead of leaving ChatGPT to improvise a generic helper view.",kicker:"Guidance",headline:"The AI leads, the user confirms the launch.",copy:data.goal,items:[
            '<div class="vibe-item"><strong>Default path</strong><p>'+esc((data.defaultFlow||[]).join(" "))+'</p></div>',
            '<div class="vibe-item"><strong>Behavior guardrails</strong><p>'+esc((data.assistantBehavior||[]).slice(0,4).join(" "))+'</p></div>'
          ]};
        }
        if(typeof data.headline==="string"&&Array.isArray(data.premiumLaunchChecklist)){
          state.insight={kind:"guidance",title:"Launch best practices",intro:"This state teaches the model how to make public launches feel intentional and premium without dumping process mechanics into the chat.",kicker:"Launch polish",headline:data.headline,copy:data.summary||"",items:[
            '<div class="vibe-item"><strong>Premium checklist</strong><p>'+esc((data.premiumLaunchChecklist||[]).join(" • "))+'</p></div>',
            '<div class="vibe-item"><strong>Cover image</strong><p>'+esc(data.coverGuidance&&data.coverGuidance.whyItMatters?data.coverGuidance.whyItMatters:"")+'</p></div>',
            '<div class="vibe-item"><strong>SEO and previews</strong><p>'+esc(data.seoGuidance&&data.seoGuidance.whyItMatters?data.seoGuidance.whyItMatters:"")+'</p></div>'
          ],actions:[
            {label:"Check account capabilities",type:"tool",tool:"get_account_capabilities",args:{}},
            {label:"See pulse guidance",type:"tool",tool:"get_pulse_setup_guidance",args:{}}
          ]};
        }
        if(typeof data.headline==="string"&&Array.isArray(data.whenYouNeedPulses)){
          state.insight={kind:"capabilities",title:"Pulse setup guidance",intro:"This state helps the model decide when frontend-only is enough and when Vibecodr should use pulse-backed server logic.",kicker:"Backend",headline:data.headline,copy:data.summary||"",items:[
            '<div class="vibe-item"><strong>Frontend-only is enough when</strong><p>'+esc((data.whenFrontendOnlyIsEnough||[]).join(" • "))+'</p></div>',
            '<div class="vibe-item"><strong>You need pulses when</strong><p>'+esc((data.whenYouNeedPulses||[]).join(" • "))+'</p></div>',
            '<div class="vibe-item"><strong>Best practices</strong><p>'+esc((data.pulseBestPractices||[]).join(" • "))+'</p></div>'
          ],actions:[
            {label:"Check account capabilities",type:"tool",tool:"get_account_capabilities",args:{}}
          ]};
        }
        if(data.account&&typeof data.account==="object"){
          markHostConnected();
          const account=data.account;
          const features=[
            account.features&&account.features.customSeo?miniBadge("Custom SEO","ok"):miniBadge("SEO locked","warn"),
            account.features&&account.features.canUsePrivateOrUnlisted?miniBadge("Private or unlisted","ok"):miniBadge("Public only","info"),
            account.features&&account.features.pulsesEnabled?miniBadge("Pulses enabled","ok"):miniBadge("No pulses","warn")
          ].join("");
          state.insight={kind:"capabilities",title:"Account capabilities",intro:"This view gives the model a real account/plan context so it stops guessing about launch polish, visibility, and pulse-backed behavior.",kicker:(account.profile&&account.profile.plan?String(account.profile.plan):"Account").toUpperCase(),headline:"This account can launch intentionally.",copy:"Use these limits before promising premium polish, private visibility, or additional pulse-backed work.",items:[
            '<div class="vibe-item"><strong>Available now</strong><div class="mini-badges">'+features+'</div></div>',
            '<div class="vibe-item"><strong>Pulse capacity</strong><p>'+esc(["Slots left "+String(account.remaining&&account.remaining.pulseSlots!==undefined?account.remaining.pulseSlots:0),"Pulse runs left "+String(account.remaining&&account.remaining.pulseRunsThisMonth!==undefined?account.remaining.pulseRunsThisMonth:"unknown"),"Webhook calls left "+String(account.remaining&&account.remaining.webhookCalls!==undefined?account.remaining.webhookCalls:0)].join(" • "))+'</p></div>',
            '<div class="vibe-item"><strong>Guidance</strong><p>'+esc((account.recommendations||[]).join(" "))+'</p></div>'
          ],actions:[
            {label:"See launch polish",type:"tool",tool:"get_launch_best_practices",args:{}},
            {label:"See pulse guidance",type:"tool",tool:"get_pulse_setup_guidance",args:{}}
          ]};
        }
        if(Array.isArray(data.sourceTypes)&&Array.isArray(data.importModes)){
          state.insight={kind:"capabilities",title:"Upload capabilities",intro:"This view summarizes supported ingest paths and defaults without exposing a dashboard or raw schemas.",kicker:"Capabilities",headline:"Public vibe is the default launch path.",copy:"Vibecodr supports multiple import modes, but the normal flow should still feel like one guided publish story.",items:[
            '<div class="vibe-item"><strong>Sources</strong><div class="mini-badges">'+(data.sourceTypes||[]).map((x)=>miniBadge(x,"info")).join("")+'</div></div>',
            '<div class="vibe-item"><strong>Import modes</strong><div class="mini-badges">'+(data.importModes||[]).map((x)=>miniBadge(x,"info")).join("")+'</div></div>',
            '<div class="vibe-item"><strong>Runners</strong><div class="mini-badges">'+(data.runners||[]).map((x)=>miniBadge(x,"ok")).join("")+'</div></div>'
          ]};
        }
        if(data.operation&&typeof data.operation==="object"){
          markHostConnected();
          state.operation=data.operation;
          state.diagnostics=Array.isArray(data.operation.diagnostics)?data.operation.diagnostics:[];
        }
        if(data.draft&&typeof data.draft==="object"){
          markHostConnected();
          state.insight={kind:"drafts",title:"Draft summary",intro:"A compact draft state is easier to follow than raw object output when the user is deciding whether to launch or keep polishing.",kicker:"Draft",headline:data.draft.title||data.draft.draftId||"Draft ready",copy:"This draft is staged in Vibecodr and can move forward once the publish decision is confirmed.",items:[
            '<div class="vibe-item"><strong>Package</strong><p>'+esc([data.draft.packageSummary&&data.draft.packageSummary.runner,data.draft.packageSummary&&data.draft.packageSummary.entry,data.draft.packageSummary&&data.draft.packageSummary.fileCount!==undefined?String(data.draft.packageSummary.fileCount)+" files":""].filter(Boolean).join(" • "))+'</p></div>'
          ]};
        }
        if(Array.isArray(data.drafts)){
          markHostConnected();
          state.insight={kind:"drafts",title:"Existing drafts",intro:"When the conversation needs a draft browser, the widget should feel like a curated shortlist rather than a raw dump.",kicker:"Drafts",headline:"Recent Vibecodr drafts",copy:"These drafts are available if the user wants to continue an earlier launch instead of publishing a new creation.",items:(data.drafts||[]).slice(0,5).map((draft)=>'<div class="vibe-item"><strong>'+esc(draft.title||draft.draftId||"Draft")+'</strong><p>'+esc([draft.visibility||"",draft.status||"",draft.packageSummary&&draft.packageSummary.entry?draft.packageSummary.entry:""].filter(Boolean).join(" • "))+'</p></div>')};
        }
        if(Array.isArray(data.vibes)){
          markHostConnected();
          state.insight={kind:"drafts",title:"Live vibes",intro:"This view turns existing published work into a manageable shortlist so the conversation can continue from what is already live.",kicker:"Live vibes",headline:data.profile&&data.profile.handle?("@"+data.profile.handle+"'s live launches"):"Recent live vibes",copy:"These are the vibes already live on Vibecodr. You can open one, share it, or refine its launch metadata without starting over.",items:(data.vibes||[]).slice(0,5).map((vibe)=>'<div class="vibe-item"><strong>'+esc(vibe.title||vibe.postId||"Live vibe")+'</strong><p>'+esc([vibe.visibility||"",vibe.authorHandle?("@"+vibe.authorHandle):"",vibe.stats?String(vibe.stats.runs)+" runs":"",vibe.stats?String(vibe.stats.likes)+" likes":""].filter(Boolean).join(" • "))+'</p></div>')};
          state.links=(data.vibes||[]).slice(0,3).map((vibe)=>({label:(vibe.title||"Open vibe"),href:vibe.playerUrl||vibe.postUrl})).filter((x)=>x.href);
        }
        if(data.vibe&&data.share&&typeof data.vibe==="object"&&typeof data.share==="object"){
          markHostConnected();
          state.insight={kind:"overview",title:"Launch complete",intro:"A published vibe should land like a release moment: one clear result, one share path, and one next move.",kicker:"Live now",headline:data.vibe.title||"Your vibe is live",copy:"The vibe is live on Vibecodr and ready to be opened, shared, remixed, and refined without leaving the conversation.",items:[
            '<div class="vibe-item"><strong>Live outcome</strong><p>'+esc([data.vibe.visibility||"",data.vibe.authorHandle?("@"+data.vibe.authorHandle):"",data.vibe.packageSummary&&data.vibe.packageSummary.entry?data.vibe.packageSummary.entry:""].filter(Boolean).join(" • "))+'</p></div>',
            '<div class="vibe-item"><strong>Early signal</strong><p>'+esc(['Runs '+((data.vibe.stats&&data.vibe.stats.runs)||0),'Likes '+((data.vibe.stats&&data.vibe.stats.likes)||0),'Comments '+((data.vibe.stats&&data.vibe.stats.comments)||0),'Remixes '+((data.vibe.stats&&data.vibe.stats.remixes)||0)].join(" • "))+'</p></div>'
          ],actions:[
            {label:"Open live vibe",type:"link",href:data.vibe.playerUrl||data.vibe.postUrl},
            {label:"Copy share link",type:"copy",value:data.share.playerUrl||data.share.postUrl}
          ]};
          state.links=[{label:"Open live vibe",href:data.vibe.playerUrl||data.vibe.postUrl},{label:"Open post",href:data.vibe.postUrl||data.vibe.playerUrl}].filter((x)=>x.href);
        }
        else if(data.vibe&&typeof data.vibe==="object"){
          markHostConnected();
          state.insight={kind:"overview",title:"Live vibe",intro:"The widget can summarize the live post without sending the user to an operator view.",kicker:"Published",headline:data.vibe.title||"Live vibe",copy:"This vibe is already live on Vibecodr and can be opened, shared, remixed, and refined from here.",items:[
            '<div class="vibe-item"><strong>Launch state</strong><p>'+esc([data.vibe.visibility||"",data.vibe.authorHandle?("@"+data.vibe.authorHandle):"",data.vibe.packageSummary&&data.vibe.packageSummary.entry?data.vibe.packageSummary.entry:""].filter(Boolean).join(" • "))+'</p></div>',
            '<div class="vibe-item"><strong>Engagement</strong><p>'+esc(['Runs '+((data.vibe.stats&&data.vibe.stats.runs)||0),'Likes '+((data.vibe.stats&&data.vibe.stats.likes)||0),'Comments '+((data.vibe.stats&&data.vibe.stats.comments)||0),'Remixes '+((data.vibe.stats&&data.vibe.stats.remixes)||0)].join(" • "))+'</p></div>'
          ],actions:[
            {label:"Open live vibe",type:"link",href:data.vibe.playerUrl||data.vibe.postUrl},
            {label:"Show engagement",type:"tool",tool:"get_vibe_engagement_summary",args:{postId:data.vibe.postId}}
          ]};
          state.links=[{label:"Open live vibe",href:data.vibe.playerUrl||data.vibe.postUrl},{label:"Open post",href:data.vibe.postUrl||data.vibe.playerUrl}].filter((x)=>x.href);
        }
        if(data.engagement&&typeof data.engagement==="object"){
          markHostConnected();
          state.insight={kind:"guidance",title:"Engagement summary",intro:"This state keeps the conversation focused on what happened after launch, not on deployment mechanics.",kicker:"Performance",headline:data.engagement.title||"Live vibe performance",copy:data.engagement.summary||"This vibe is live and gathering activity on Vibecodr.",items:[
            '<div class="vibe-item"><strong>Stats</strong><p>'+esc(['Runs '+((data.engagement.stats&&data.engagement.stats.runs)||0),'Likes '+((data.engagement.stats&&data.engagement.stats.likes)||0),'Comments '+((data.engagement.stats&&data.engagement.stats.comments)||0),'Remixes '+((data.engagement.stats&&data.engagement.stats.remixes)||0)].join(" • "))+'</p></div>'
          ],actions:[
            {label:"Open live vibe",type:"link",href:data.engagement.playerUrl||data.engagement.postUrl},
            {label:"Get share link",type:"tool",tool:"get_vibe_share_link",args:{postId:data.engagement.postId}}
          ]};
          state.links=[{label:"Open player",href:data.engagement.playerUrl},{label:"Open post",href:data.engagement.postUrl}].filter((x)=>x.href);
        }
        if(data.share&&typeof data.share==="object"){
          markHostConnected();
          state.insight={kind:"guidance",title:"Share state",intro:"A live vibe should end with a shareable result, not just a status label.",kicker:"Share",headline:data.share.title||"Share this vibe",copy:data.share.shareCta||"Share the live link so people can run the vibe immediately.",items:[
            '<div class="vibe-item"><strong>Visibility</strong><p>'+esc(data.share.visibility||"public")+'</p></div>',
            '<div class="vibe-item"><strong>Best link</strong><p>'+esc(data.share.playerUrl||data.share.postUrl||"")+'</p></div>'
          ],actions:[
            {label:"Copy share link",type:"copy",value:data.share.playerUrl||data.share.postUrl},
            {label:"Open live vibe",type:"link",href:data.share.playerUrl||data.share.postUrl}
          ]};
          state.links=[{label:"Open player",href:data.share.playerUrl},{label:"Open post",href:data.share.postUrl}].filter((x)=>x.href);
        }
        if(Object.prototype.hasOwnProperty.call(data,"readyToPublish")){
          markHostConnected();
          state.insight={kind:"guidance",title:"Publish readiness",intro:"This state should explain whether launch can continue without throwing the user into operation diagnostics.",kicker:"Readiness",headline:data.readyToPublish?"Ready to go live":"Needs one more step",copy:data.readyToPublish?"The draft is clear to publish.":"The launch still has one blocking issue or missing decision.",items:(data.checks||[]).map((check)=>'<div class="vibe-item"><strong>'+esc(check.id||"Check")+'</strong><p>'+esc(check.message||"")+'</p></div>')};
        }
        if(Array.isArray(data.recommendedActions)) state.recommendations=data.recommendedActions;
        if(Array.isArray(data.latestDiagnostics)) state.diagnostics=data.latestDiagnostics;
        if(data.userMessage||data.rootCauseMessage){
          state.recommendations=[].concat(data.userMessage?[data.userMessage]:[]).concat(Array.isArray(data.nextActions)?data.nextActions:[]);
          state.diagnostics=Array.isArray(data.latestDiagnostics)?data.latestDiagnostics:state.diagnostics;
        }
      }
      renderInsight();
      renderOperation();
    }
    function parsePayload(){const raw=currentPayloadText(); if(!raw){renderCallout("warn","Creation needed","ChatGPT still needs to hand over the real creation package before launch can continue."); return null} const parsed=parseJson(raw,"Creation package"); if(!parsed.ok) return null; const payload=parsed.value; payload.importMode=value("importMode"); return payload}
    function setBusy(busy){[refs.oauthBtn,refs.logoutBtn,refs.importBtn,refs.quickPublishBtn,refs.polishToggleBtn,refs.watchBtn,refs.compileBtn,refs.publishBtn,refs.getOpBtn,refs.explainFailureBtn,refs.cancelBtn,refs.listBtn,refs.listDraftsBtn,${allowManualTokenLink ? 'document.getElementById("linkBtn")' : ""}].filter(Boolean).forEach((b)=>b.disabled=busy)}
    async function copyText(text){try{if(navigator.clipboard&&typeof navigator.clipboard.writeText==="function"){await navigator.clipboard.writeText(text); renderCallout("ok","Link copied","The live vibe link is ready to share."); return true}}catch{} renderCallout("info","Copy this link",text); return false}
    function renderInsightActions(actions){if(!refs.insightActions) return; const safeActions=Array.isArray(actions)?actions.slice(0,2):[]; refs.insightActions.innerHTML=safeActions.map((action,index)=>'<button type="button" class="'+(index===0?'primary':'secondary')+'" data-insight-action="'+index+'">'+esc(action.label)+'</button>').join(""); refs.insightActions.hidden=safeActions.length===0; refs.insightActions.querySelectorAll("[data-insight-action]").forEach((button)=>button.addEventListener("click",async()=>{const action=safeActions[Number(button.getAttribute("data-insight-action"))]; if(!action) return; if(action.type==="link"&&action.href){window.open(action.href,"_blank","noopener,noreferrer"); return} if(action.type==="copy"&&action.value){await copyText(action.value); return} if(action.type==="tool"&&action.tool){await runAction(action.label,()=>mcpCall(action.tool,action.args||{}));}}))}
    function applyHostContext(){const root=document.documentElement; const theme=(window.openai&&window.openai.theme)||((window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"); root.dataset.theme=theme==="dark"?"dark":"light"; const displayMode=(window.openai&&window.openai.displayMode)||"inline"; root.dataset.displayMode=displayMode; const hostNote=document.getElementById("hostNote"); if(hostNote){hostNote.textContent=displayMode==="sidebar"?"The layout has shifted into a stacked mode to fit ChatGPT's tighter sidebar canvas while keeping the guided publish flow intact.":"Designed for inline guided publishing inside ChatGPT, with advanced controls hidden until the flow actually needs them."}}
    function hydrateFromHost(){if(!(window.openai&&typeof window.openai==="object")) return; const toolInput=window.openai.toolInput; if(toolInput&&typeof toolInput==="object"){if(toolInput.payload&&typeof toolInput.payload==="object"){state.packagePayload=toolInput.payload; if(refs.payload) refs.payload.value=JSON.stringify(toolInput.payload,null,2)} if(typeof toolInput.sourceType==="string") setSegment("sourceType",toolInput.sourceType); if(typeof toolInput.visibility==="string") setSegment("publishVisibility",toolInput.visibility)} const toolOutput=window.openai.toolOutput; if(toolOutput&&typeof toolOutput==="object") applyStructuredContent(toolOutput); summarizePackage()}
    function syncFromHost(force){if(!hasHostBridge()) return false; const snapshot=readHostSnapshot(); if(!force&&snapshot===hostSync.lastSnapshot) return false; hostSync.lastSnapshot=snapshot; hydrateFromHost(); if(hostSync.pendingMutationSnapshot&&snapshot!==hostSync.pendingMutationSnapshot){clearHostMutationWatch(); stopHostPolling(); setBusy(false)} return true}
    function scheduleHostSync(force){if(force){syncFromHost(true); return} if(hostSync.scheduled) return; hostSync.scheduled=true; const run=()=>{hostSync.scheduled=false; syncFromHost(false)}; if(typeof window.requestAnimationFrame==="function") window.requestAnimationFrame(run); else window.setTimeout(run,0)}
    async function refreshAuth(){if(!canProbeCookieSession()){renderAuth(); renderOperation(); return} try{const res=await apiCall("/api/auth/session"); if(res.data&&res.data.authenticated){state.session=res.data; uiState.hostConnected=uiState.hostConnected||res.data.authMode==="oauth_bearer"; state.authPrompt=false} else if(!uiState.hostConnected){state.session=res.data}}catch{if(!uiState.hostConnected){state.session={authenticated:false}}} renderAuth(); renderOperation()}
    async function runAction(label,fn){beginHostMutationWatch(); startHostPolling(); try{setBusy(true); renderCallout("info",label,"Working through the request."); applyStructuredContent(await fn()); syncFromHost(true)}catch(error){const message=error instanceof Error?error.message:String(error); renderCallout("err",label+" failed",message); setOutput({error:message})}finally{clearHostMutationWatch(); stopHostPolling(); setBusy(false)}}
    on(refs.oauthBtn,"click",()=>{window.location.href=absoluteAppUrl("/auth/start?return_to=%2Fwidget")});
    on(refs.logoutBtn,"click",async()=>{const res=await apiCall("/api/auth/logout",{method:"POST"}); setOutput(res.data); await refreshAuth(); state.operation=null; state.recommendations=[]; state.diagnostics=[]; state.links=[]; uiState.polishOpen=false; renderOperation()});
    ${allowManualTokenLink ? `on(document.getElementById("linkBtn"),"click",async()=>{const token=document.getElementById("token").value.trim(); const userId=document.getElementById("userId").value.trim(); const res=await apiCall("/api/auth/link",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,userId:userId||undefined})}); setOutput(res.data); await refreshAuth()});` : ""}
    on(refs.polishToggleBtn,"click",()=>{uiState.polishOpen=true; updateSurfaceVisibility(); if(refs.polishDetails) refs.polishDetails.open=true});
    on(refs.importBtn,"click",async()=>{const payload=parsePayload(); if(!payload) return; await runAction("Importing creation",()=>mcpCall("start_creation_import",{sourceType:value("sourceType"),payload}))});
    on(refs.quickPublishBtn,"click",async()=>{const payload=parsePayload(); if(!payload) return; const thumbnailInput=await buildThumbnailInput(); if(thumbnailInput===null) return; const seo=buildSeo(); await runAction("Publishing vibe",()=>mcpCall("quick_publish_creation",{sourceType:value("sourceType"),payload,autoCompile:true,timeoutSeconds:120,pollIntervalMs:1500,visibility:value("publishVisibility"),...(value("coverKey").trim()?{coverKey:value("coverKey").trim()}:{}),...(thumbnailInput||{}),...(seo?{seo}:{})}))});
    on(refs.watchBtn,"click",async()=>{const operationId=refs.operationId.value.trim(); if(!operationId){renderCallout("warn","Operation needed","Run an import first or paste an operation id."); return} await runAction("Watching operation",()=>mcpCall("watch_operation",{operationId,timeoutSeconds:90,pollIntervalMs:1500}))});
    on(refs.compileBtn,"click",async()=>{const operationId=refs.operationId.value.trim(), capsuleId=refs.capsuleId.value.trim(); if(!operationId||!capsuleId){renderCallout("warn","Draft not ready","Compile needs both operation id and capsule id."); return} await runAction("Compiling draft",()=>mcpCall("compile_draft_capsule",{operationId,capsuleId}))});
    on(refs.publishBtn,"click",async()=>{const operationId=refs.operationId.value.trim(), capsuleId=refs.capsuleId.value.trim(); if(!operationId||!capsuleId){renderCallout("warn","Draft not ready","Publish needs both operation id and capsule id."); return} const thumbnailInput=await buildThumbnailInput(); if(thumbnailInput===null) return; const seo=buildSeo(); await runAction("Publishing current draft",()=>mcpCall("publish_draft_capsule",{operationId,capsuleId,visibility:value("publishVisibility"),...(value("coverKey").trim()?{coverKey:value("coverKey").trim()}:{}),...(thumbnailInput||{}),...(seo?{seo}:{})}))});
    on(refs.getOpBtn,"click",async()=>{const operationId=refs.operationId.value.trim(); if(!operationId){renderCallout("warn","Operation needed","Paste an operation id to refresh it."); return} await runAction("Refreshing operation",()=>mcpCall("get_import_operation",{operationId}))});
    on(refs.explainFailureBtn,"click",async()=>{const operationId=refs.operationId.value.trim(); if(!operationId){renderCallout("warn","Operation needed","Paste an operation id to inspect failure details."); return} await runAction("Explaining failure",()=>mcpCall("explain_operation_failure",{operationId}))});
    on(refs.cancelBtn,"click",async()=>{const operationId=refs.operationId.value.trim(); if(!operationId){renderCallout("warn","Operation needed","Paste an operation id to cancel it."); return} await runAction("Canceling operation",()=>mcpCall("cancel_import_operation",{operationId}))});
    on(refs.listBtn,"click",async()=>runAction("Listing operations",()=>mcpCall("list_import_operations",{limit:20})));
    on(refs.listDraftsBtn,"click",async()=>runAction("Listing drafts",()=>mcpCall("list_vibecodr_drafts",{})));
    on(refs.payload,"input",()=>{state.packagePayload=null; summarizePackage();});
    on(refs.thumbnailFile,"change",()=>{const file=refs.thumbnailFile.files&&refs.thumbnailFile.files[0]?refs.thumbnailFile.files[0]:null; refs.thumbnailMeta.textContent=file?file.name+" · "+Math.round(file.size/1024)+" KB":"No thumbnail selected yet"});
    const params=new URLSearchParams(window.location.search); if(params.get("auth_error")) renderCallout("err","Authentication issue",params.get("auth_error"));
    window.addEventListener("message",()=>scheduleHostSync(false));
    window.addEventListener("focus",()=>scheduleHostSync(false));
    document.addEventListener("visibilitychange",()=>{if(!document.hidden) scheduleHostSync(false)});
    applyHostContext(); syncFromHost(true); summarizePackage(); updateSurfaceVisibility(); renderJourney(); refreshAuth(); renderTimeline(); renderRecommendations();
  </script>
</body>
</html>`;
}
