/* ===========================================================
   Echo Sinclair — site · root app + hash router + tweaks
   =========================================================== */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "hero": "stacked",
  "accent": "pine",
  "paper": "warm",
  "dropcap": true,
  "reading": "comfortable"
}/*EDITMODE-END*/;

function parseHash() {
  const h = (window.location.hash || "#/").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean); // ["note","2026-..-x"]
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "notes") return { name: "notes" };
  if (parts[0] === "projects") return { name: "projects" };
  if (parts[0] === "about") return { name: "about" };
  if (parts[0] === "note" && parts[1]) return { name: "article", id: decodeURIComponent(parts.slice(1).join("/")) };
  return { name: "home" };
}
function routeToHash(r) {
  switch (r.name) {
    case "notes": return "#/notes";
    case "projects": return "#/projects";
    case "about": return "#/about";
    case "article": return "#/note/" + encodeURIComponent(r.id);
    default: return "#/";
  }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState(parseHash());
  const internal = useRef(false);

  // keep hash in sync with route; respond to back/forward
  useEffect(() => {
    const onHash = () => {
      if (internal.current) { internal.current = false; return; }
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r) => {
    const hash = routeToHash(r);
    if (window.location.hash !== hash) { internal.current = true; window.location.hash = hash; }
    setRoute(r);
    window.scrollTo(0, 0);
  };

  const rootAttrs = {
    "data-accent": t.accent,
    "data-paper": t.paper,
    "data-dropcap": t.dropcap ? "on" : "off",
    "data-reading": t.reading,
  };

  return (
    <div className="es-root es-app" {...rootAttrs}>
      <SiteHeader route={route} go={go} />
      <main className="es-main" key={route.name + (route.id || "")}>
        {route.name === "home" && <Home go={go} hero={t.hero} />}
        {route.name === "notes" && <BlogIndex go={go} route={route} />}
        {route.name === "article" && <Article id={route.id} go={go} />}
        {route.name === "about" && <About go={go} />}
        {route.name === "projects" && <Projects go={go} />}
      </main>
      <SiteFooter go={go} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Home hero" />
        <TweakRadio label="Layout" value={t.hero} options={["stacked", "split", "minimal"]} onChange={(v) => setTweak("hero", v)} />
        <TweakSection label="Theme" />
        <TweakRadio label="Accent" value={t.accent} options={["pine", "moss", "clay"]} onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Paper" value={t.paper} options={["warm", "light", "dusk"]} onChange={(v) => setTweak("paper", v)} />
        <TweakSection label="Reading" />
        <TweakToggle label="Drop caps" value={t.dropcap} onChange={(v) => setTweak("dropcap", v)} />
        <TweakRadio label="Text size" value={t.reading} options={["comfortable", "large"]} onChange={(v) => setTweak("reading", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
