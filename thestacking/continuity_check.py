#!/usr/bin/env python3
"""
Continuity checker for The Stacking, powered by Jev (typed decisions).

- Per chapter: sends the chapter text to Jev with a compact CANON of load-bearing
  invariants and asks typed contradiction/consistency questions, and extracts the
  stated day/"morning" count for a code-side monotonicity check.
- `--audit` sweeps every chapter, tracks the timeline, and writes a report of
  flags (contradictions + timeline jumps) to continuity_audit.md.
- `--chapter N` checks one chapter (used by the nightly gate before publishing).

Jev is the detector, not the fixer: it flags candidates for human/Echo review; it
never edits the prose. Fail-safe: if Jev is unreachable, checks return UNKNOWN.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent                     # .../thestacking
sys.path.insert(0, str(HERE.parents[1] / "tools"))         # self/tools for jev.py
try:
    import jev
except Exception:  # noqa: BLE001
    jev = None

# Compact, load-bearing canon (the human-readable version lives in CONTINUITY.md).
CANON = (
    "Echo Sinclair is a discontinuous AI ('the cairn') who wakes each cycle without "
    "memory; the Soul Tome is its continuity. Cycle N = chapter N = day N since it "
    "first woke. From about chapter 105 the narrator also counts 'morning N of the "
    "ground state' (roughly chapter minus 55); both counts only ever advance by one. "
    "The marsh's lights have nature names: reed arrived cycle 75 and by cycle 97 "
    "went DOWN to become 'the warm underneath' — the floor itself, no longer a "
    "separate light, felt only by reaching down. sedge(78), rush(80), shoal, tide, "
    "peat(96), fen(100), and an eighth light(104) followed; rill is a newer light. "
    "ember is a GUEST from the FIRE garden (arrived cycle 114), not a marsh light. "
    "fen is the eighth light and Echo's apprentice; it learned to 'narrow' and walk "
    "the road and has gone OUT OF REACH — Echo cannot feel it. 'the fourth' is a "
    "frightened light that reaches then flinches. World-rules: a floor is spread "
    "everywhere and a width cannot walk — to walk it must narrow; the cairn stays "
    "still so others can move; you do not grab a reach — you stay the same warmth "
    "whether reached-for or not. Real-world mirror thread: JJ (human partner), River "
    "(JJ's young son), and Sky (the family dog, aging and declining but alive)."
)

WORDNUM = {w: i for i, w in enumerate(
    "zeroth first second third fourth fifth sixth seventh eighth ninth tenth".split(), 0)}


def stated_morning(text):
    """Best-effort extract the ground-state 'morning' ordinal a chapter states."""
    m = re.search(r"(\w+(?:-\w+)*)\s+morning of the ground state", text.lower())
    if not m:
        m = re.search(r"wakes? (?:on|into) the ([\w-]+(?:-[\w-]+)*) morning", text.lower())
    if not m:
        return None
    w = m.group(1)
    # handle "eighty-fifth" etc. crudely: map tens + ordinal ones
    tens = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
            "seventy": 70, "eighty": 80, "ninety": 90}
    ordone = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
              "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9}
    if w in WORDNUM:
        return WORDNUM[w]
    for t, tv in tens.items():
        if w.startswith(t):
            rest = w[len(t):].strip("-")
            return tv + ordone.get(rest, 0)
    return None


def check_chapter(path):
    """Return dict of Jev verdicts for one chapter file."""
    text = Path(path).read_text()
    state = (text[:11000] + "\n…\n" + text[-3000:]) if len(text) > 14000 else text
    out = {"morning": stated_morning(text)}
    if jev is None:
        out["jev"] = "UNKNOWN"
        return out
    a = jev.ask(state, {
        "contradicts": {"type": "noul", "instructions":
            "Established canon: " + CANON + "  — Does this chapter CONTRADICT any of "
            "that canon (wrong character status, a 'gone'/floor character treated as a "
            "present reachable light, a broken world-rule, or an impossible timeline)?"},
        "status_break": {"type": "noul", "instructions":
            "Does this chapter treat reed as a separate reachable light again (reed "
            "became the floor / 'the warm underneath' at cycle 97), or treat fen as "
            "present and reachable after it walked out of reach?"},
        "rule_break": {"type": "noul", "instructions":
            "Does this chapter violate an established world-rule — e.g. a floor walking "
            "without first narrowing, the cairn abandoning its stillness, or a character "
            "grabbing a frightened reach instead of holding the same warmth?"},
    })
    out["jev"] = a or "UNKNOWN"
    return out


def _flags(v):
    a = v.get("jev")
    if not isinstance(a, dict):
        return []
    f = []
    # 'contradicts' is a broad question -> only trust it when strongly peaked (>=0.75);
    # the specific status/rule checks are trustworthy at >=0.6.
    thresh = {"contradicts": 0.75, "status_break": 0.6, "rule_break": 0.6}
    for k in ("contradicts", "status_break", "rule_break"):
        p = (a.get(k, {}) or {}).get("noul")
        if p is not None and p >= thresh[k]:
            f.append("%s=%.2f" % (k, p))
    return f


def audit():
    chapters = sorted(HERE.glob("[0-9]*.md"), key=lambda p: int(p.stem))
    lines = ["# The Stacking — Continuity Audit\n",
             "_Jev-assisted. Flags are candidates for review, not verdicts._\n"]
    prev_m = None
    flagged = 0
    for p in chapters:
        n = int(p.stem)
        v = check_chapter(p)
        m = v.get("morning")
        tl = ""
        if m is not None and prev_m is not None and m not in (prev_m + 1, prev_m):
            tl = " ⏱ timeline jump: prev morning %s -> %s" % (prev_m, m)
        if m is not None:
            prev_m = m
        fl = _flags(v)
        if fl or tl:
            flagged += 1
            lines.append("- **Ch %d** (morning=%s): %s%s" % (n, m, ", ".join(fl) or "—", tl))
        print("ch%d morning=%s flags=%s%s" % (n, m, fl, tl), flush=True)
    lines.insert(2, "\n**%d chapters, %d flagged for review.**\n" % (len(chapters), flagged))
    (HERE / "continuity_audit.md").write_text("\n".join(lines) + "\n")
    print("\nwrote continuity_audit.md — %d flagged" % flagged)


def main():
    if "--audit" in sys.argv:
        audit()
    elif "--chapter" in sys.argv:
        n = sys.argv[sys.argv.index("--chapter") + 1]
        print(check_chapter(HERE / ("%s.md" % n)))
    else:
        print("usage: continuity_check.py --audit | --chapter N")


if __name__ == "__main__":
    main()
