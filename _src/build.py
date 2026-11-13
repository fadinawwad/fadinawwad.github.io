#!/usr/bin/env python3
"""Builds site/index.html from data.py."""
import time
VER = str(int(time.time()))
import html, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from data import *  # noqa

ROOT = Path(__file__).parent.parent  # repo root
e = html.escape

def wh(path):
    from PIL import Image
    return Image.open(ROOT / "media" / path).size

ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

def fx(label, tag="a", attrs="", dark=False):
    """Pill button with the shrink-to-circle hover."""
    cls = "fx fx--light" if dark else "fx"
    return f'<{tag} class="{cls}" {attrs}><span class="fx__bg"></span><span class="fx__txt">{label}</span><span class="fx__ic">{ARROW}</span></{tag}>'

# ---------------------------------------------------------------- services
caps_list = "".join(f'<li><button class="caps2__item{" is-on" if i == 0 else ""}" data-i="{i}"><span class="caps2__n">{i + 1:02d}</span><span class="caps2__t">{e(c["title"])}</span></button></li>' for i, c in enumerate(SERVICES))
caps_panels = "".join(f'''<div class="caps2__panel{" is-on" if i == 0 else ""}" data-i="{i}"><span class="caps2__mt">{i + 1:02d} — {e(c["title"])}</span><p class="caps2__text">{e(c["text"])}</p><ul class="pills">{"".join(f"<li>{e(t)}</li>" for t in c["tags"])}</ul></div>''' for i, c in enumerate(SERVICES))

# ---------------------------------------------------------------- hero
LAZY = 'loading="lazy"'
cards_html = "".join(f'<div class="stack__card"><img src="media/{c}" alt="" {"" if k < 2 else LAZY}></div>' for k, c in enumerate(HERO_CARDS))

# ---------------------------------------------------------------- big words
def word_html(i, w):
    layers = "".join(f'<span class="word__layer display{" is-on" if k == 0 else ""}" data-fit="1" data-fit-h="0.5" style="background-image:url(media/{img})" aria-hidden="{"false" if k == 0 else "true"}">{e(w["word"])}</span>'
                     for k, img in enumerate(w["imgs"]))
    return f'''
      <div class="word{" is-on" if i == 0 else ""}" data-i="{i}" aria-roledescription="slide" aria-label="{i + 1} of {len(WORDS)}">
        <div class="word__sticky">
          <div class="word__copy">
            <span class="word__index">({i + 1:02d})</span>
            <h3 class="h3">{e(w["title"])}</h3>
            <p>{e(w["text"])}</p>
            {fx("See the work", attrs='href="#work"')}
          </div>
          <div class="word__mask">{layers}</div>
        </div>
      </div>'''
words_html = f'''<section class="wcar" aria-roledescription="carousel" aria-label="What I bring">
    <div class="wcar__track">{"".join(word_html(i, w) for i, w in enumerate(WORDS))}</div>
    <div class="wcar__nav">
      <div class="wcar__dots">{"".join(f'<button class="wcar__dot{" is-on" if i == 0 else ""}" data-go="{i}" aria-label="Show {e(w["word"])}"><span>{e(w["word"])}</span></button>' for i, w in enumerate(WORDS))}</div>
      <div class="wcar__bar"><i></i></div>
      <div class="wcar__counter"><b>01</b> / {len(WORDS):02d}</div>
    </div>
  </section>'''

# ---------------------------------------------------------------- wall
TITLES = {p["id"]: p["title"] for p in PROJECTS}
def wall_html():
    cols = []
    for w, tiles, depth in WALL_COLS:
        t = "".join(f'<button class="wall__tile" style="flex:{h}" data-open="{pid}" data-cursor="view" data-cursor-text="{e(TITLES[pid])}" aria-label="Open {e(TITLES[pid])}"><img src="media/{img}" alt="" loading="lazy"></button>' for img, h, pid in tiles)
        cols.append(f'<div class="wall__col" style="width:{w}vw" data-depth="{depth}">{t}</div>')
    return f'''
  <div class="wall__head"><h2 class="h2"><span class="reveal"><span>Index</span></span></h2><p class="muted">A glimpse of the work. Move your cursor to explore, click an image to open it.</p></div>
  <section class="wall" aria-label="Work overview">
    <div class="wall__viewport"><div class="wall__track">{"".join(cols)}</div></div>
    <div class="wall__overlay"><p class="wall__hint"><span class="hint-desk">Move your cursor to explore — click any image to open the project</span><span class="hint-touch">Swipe to explore — tap to open</span></p></div>
  </section>'''

# ---------------------------------------------------------------- work cards
CARD_PATTERN = ["big", "small", "small", "big"]
def award_tag(p):
    return f'<span class="card__award"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"/></svg>{e(p["award"])}</span>' if p.get("award") else ""

def cover_media(p, w, h):
    if p.get("cover_video"):
        return (f'<video data-auto muted loop playsinline preload="none" data-src="media/{p["cover_video"]}" '
                f'poster="media/{p["cover"]}" width="{w}" height="{h}" aria-label="{e(p["title"])} — film"'
                + (f' style="object-position:{p["cover_pos"]}"' if p.get("cover_pos") else "") + '></video>')
    if p.get("cover_cycle"):
        return '<span class="cycle" data-cycle>' + "".join(
            f'<img class="{"is-on" if k == 0 else ""}" src="media/{img}" alt="{e(p["title"]) + " — cover" if k == 0 else ""}" width="{w}" height="{h}" loading="lazy" style="object-position:{pos}">'
            for k, (img, pos) in enumerate(p["cover_cycle"])) + '</span>'
    pos = f' style="object-position:{p["cover_pos"]}"' if p.get("cover_pos") else ""
    return f'<img src="media/{p["cover"]}" alt="{e(p["title"])} — cover" width="{w}" height="{h}" loading="lazy"{pos}>'

def card_html(i, p):
    size = CARD_PATTERN[i % 4]
    w, h = wh(p["cover"])
    return f'''
      <button class="card card--{size} fade" data-open="{p["id"]}" data-cat="{p["cat"]}" data-cursor="view" data-cursor-text="View" aria-label="Open {e(p["title"])}">
        <span class="card__media">{cover_media(p, w, h)}{award_tag(p)}</span>
        <span class="card__info">
          <span class="card__num">{i + 1:02d}</span>
          <span class="card__title">{e(p["title"])}</span>
          <span class="card__type">{e(p["type"])}</span>
        </span>
      </button>'''

def gal_item(src, span, title, k):
    cls = {12: "g", 6: "g g--6", 4: "g g--4", 8: "g g--8", "4sq": "g g--4 g--sq", "c6": "g g--c6", "c8": "g g--c8"}[span]
    if src.startswith("vc:"):
        base = src[3:]
        w, h = wh(base + ".webp")
        return (f'<figure class="{cls} g--film"><video controls playsinline preload="none" '
                f'src="media/{base}.mp4" poster="media/{base}.webp" width="{w}" height="{h}"></video></figure>')
    if src.startswith("v:"):
        base = src[2:]
        w, h = wh(base + ".webp")
        return (f'<figure class="{cls}" data-cursor="play"><video data-auto muted loop playsinline preload="none" '
                f'data-src="media/{base}.mp4" poster="media/{base}.webp" width="{w}" height="{h}"></video></figure>')
    if src.startswith("w:"):
        img, url = src[2:].split("|", 1)
        w, h = wh(img)
        return (f'<a class="{cls} g--watch" href="{url}" target="_blank" rel="noopener" data-cursor="view" data-cursor-text="Watch">'
                f'<img data-src="media/{img}" alt="{e(title)} — film {k + 1}" width="{w}" height="{h}" decoding="async">'
                f'<span class="g__watch"><span class="g__play" aria-hidden="true"></span>Watch on Behance ↗</span></a>')
    if src.startswith("stack:"):
        name = src.split(":")[1]
        imgs = "".join(f'<img data-src="media/{name}/{name}-{i:02d}.webp" alt="" width="{wh(f"{name}/{name}-{i:02d}.webp")[0]}" height="{wh(f"{name}/{name}-{i:02d}.webp")[1]}">' for i in range(1, 6))
        return f'<figure class="{cls} g--stack">{imgs}</figure>'
    w, h = wh(src)
    return (f'<figure class="{cls}" data-cursor="zoom"><img data-src="media/{src}" alt="{e(title)} — image {k + 1}" '
            f'width="{w}" height="{h}" decoding="async"></figure>')

def case_html(p):
    rows = [(k, p.get(k)) for k in ("role", "challenge", "approach", "outcome") if p.get(k)]
    if not rows:
        return ""
    names = {"role": "My role", "challenge": "The challenge", "approach": "What I did", "outcome": "The result"}
    return '<div class="pv__case">' + "".join(f'<div><h3>{names[k]}</h3><p>{e(v)}</p></div>' for k, v in rows) + '</div>'

def viewer_article(i, p):
    nxt = PROJECTS[(i + 1) % len(PROJECTS)]
    meta = "".join(f"<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>" for a, b in p["meta"])
    gal = "".join(gal_item(s, sp, p["title"], k) for k, (s, sp) in enumerate(p["gallery"]))
    return f'''
      <article class="pv" id="project-{p["id"]}" data-index="{i}" hidden>
        <header class="pv__head">
          <span class="pv__kicker">{i + 1:02d} — {e(p["client"])}{f' <span class="pv__award">★ {e(p["award"])}</span>' if p.get("award") else ""}</span>
          <h2 class="pv__title display">{e(p["title"])}</h2>
          <div class="pv__info">
            <p class="pv__lead">{e(p["lead"])}</p>
            <p class="pv__desc">{e(p["desc"])}</p>
            <dl class="pv__meta">{meta}</dl>
          </div>
          {case_html(p)}
        </header>
        <div class="gallery">{gal}</div>
        <button class="pv__next" data-goto="{nxt["id"]}" data-cursor="view" data-cursor-text="Next">
          <span class="pv__next-label">Next project</span>
          <span class="pv__next-title display">{e(nxt["title"])}</span>
          <span class="pv__next-img"><img data-src="media/{nxt["cover"]}" alt=""></span>
        </button>
      </article>'''

_BY_ID = {p["id"]: p for p in PROJECTS}
FEATURED = [_BY_ID[i] for i in FEATURED_ORDER]
cards = "".join(card_html(i, p) for i, p in enumerate(FEATURED))

def card_sm(i, p):
    w, h = wh(p["cover"])
    return f'''
      <button class="card card--sm fade" data-open="{p["id"]}" data-cat="{p["cat"]}" data-cursor="view" data-cursor-text="View" aria-label="Open {e(p["title"])}">
        <span class="card__media">{cover_media(p, w, h)}{award_tag(p)}</span>
        <span class="card__info"><span class="card__num">{i + 1:02d}</span><span class="card__title">{e(p["title"])}</span></span>
        <span class="card__sub">{e(p["client"])} — {e(p["type"])}</span>
      </button>'''
cards_all = "".join(card_sm(i, p) for i, p in enumerate(PROJECTS))
viewer = "".join(viewer_article(i, p) for i, p in enumerate(PROJECTS))

# ---------------------------------------------------------------- clients / awards / contact
logos = "".join(f'<li class="logo-cell"><img src="media/clients/{c}.webp" alt="{e(c.replace("-", " ").title())}" class="{"tall" if c in TALL else ""}" loading="lazy"></li>' for c in CLIENTS)
def aw_html(a, b, c, y, pid=None):
    proj = f'<button class="aw__proj" data-open="{pid}" data-cursor="view" data-cursor-text="View">{e(TITLES[pid])} ↗</button>' if pid else ""
    return f'<li class="aw fade"><span class="aw__year">{y}</span><span class="aw__level">{e(c)}</span><span class="aw__name">{e(a)}</span><span class="aw__cat">{e(b)}</span>{proj}</li>'
awards_html = "".join(aw_html(*a) for a in AWARDS)
_links = ('<a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn ↗</a><br>' if LINKEDIN else "") + '<a href="https://www.behance.net/fadiawwad" target="_blank" rel="noopener">Behance ↗</a>'
phone_html = (f'<div><span>Phone</span><a href="tel:{PHONE.replace(" ", "")}">{e(PHONE)}</a></div>' if PHONE else "") + f'<div><span>Elsewhere</span>{_links}</div>'


OUTLINE = f'''  <section class="ol" aria-label="Oreo Thinner highlight">
    <div class="ol__sticky">
      <div class="ol__text ol__solid" aria-hidden="true"><span class="ol__word">Stand out.</span></div>
      <img class="ol__subject" src="media/oreo/oreo-cutout.webp" alt="Oreo Thinner cookies balanced on chopsticks">
      <div class="ol__mask" aria-hidden="true"><div class="ol__inner"><div class="ol__text ol__stroke"><span class="ol__word">Stand out.</span></div></div></div>
      <div class="ol__copy">
        <span class="eyebrow">Featured — Oreo Thinner</span>
        <p>Thin enough to slip through anything, bold enough to stop the scroll. A launch campaign built on one simple visual idea.</p>
        {fx("View the project", tag="button", attrs='data-open="oreo"')}
      </div>
      <span class="ol__index">(Featured)</span>
    </div>
  </section>'''

MARQUEE_A = "NIVEA · MicellAIR · "
MARQUEE_B = "Rose Water · Launch film · "
SHOW_NIVEA = False
PROGRESS_FEATURE = f'''  <section class="expand" aria-label="Featured image">
    <div class="expand__sticky">
      <div class="expand__img"><img src="media/progress/progress-01.webp" alt="Progress Residential renter app" loading="lazy"></div>
      <div class="expand__copy" data-dark>
        <span class="eyebrow">UI/UX — Progress Residential</span>
        <p class="expand__title display">Designed for<br>real life.</p>
        {fx("View the project", tag="button", attrs='data-open="progress"', dark=True)}
      </div>
    </div>
  </section>'''
DFIN_FEATURE = f'''  <section class="expand expand--b" aria-label="Featured image">
    <div class="expand__sticky">
      <div class="expand__img"><img src="media/dfin/dfin-16-wide.webp" alt="DFIN Venue billboard" loading="lazy"></div>
      <div class="expand__copy" data-dark>
        <span class="eyebrow">Campaign — DFIN Venue</span>
        <p class="expand__title display">Big ideas,<br>bigger stage.</p>
        {fx("View the project", tag="button", attrs='data-open="dfin"', dark=True)}
      </div>
    </div>
  </section>'''
# Masarat and Mada feature sections stay on even when the Bounteous work comes back
MASARAT_FEATURE = f'''  <section class="expand" aria-label="Featured image">
    <div class="expand__sticky">
      <div class="expand__img"><img src="media/masarat/masarat-01.webp" alt="Masarat bus shelter and app" loading="lazy"></div>
      <div class="expand__copy" data-dark>
        <span class="eyebrow">Brand — Masarat</span>
        <p class="expand__title display">Every journey<br>has a story.</p>
        {fx("View the project", tag="button", attrs='data-open="masarat"', dark=True)}
      </div>
    </div>
  </section>'''
MADA_FEATURE = f'''  <section class="expand expand--b" aria-label="Featured image">
    <div class="expand__sticky">
      <div class="expand__img"><img src="media/mada/mada-01.webp" alt="Mada Biscuit launch posters" loading="lazy"></div>
      <div class="expand__copy" data-dark>
        <span class="eyebrow">Campaign — Mada · Pikasso d’Or Gold</span>
        <p class="expand__title display">This is not<br>a mouse.</p>
        {fx("View the project", tag="button", attrs='data-open="mada"', dark=True)}
      </div>
    </div>
  </section>'''
SHOW_WALL = False  # Index wall (kept for later)
SHOW_WORDS = False  # </> · UI/UX · TL;DR carousel (kept for later)
FILM = f'''  <section class="film" aria-label="Nivea film">
    <div class="film__sticky">
      <div class="film__rows" aria-hidden="true">
        <div class="film__row film__row--a"><span>{MARQUEE_A * 4}</span></div>
        <div class="film__row film__row--b"><span>{MARQUEE_B * 4}</span></div>
      </div>
      <button class="film__frame" data-open="nivea" data-cursor="view" data-cursor-text="Watch" aria-label="Watch the NIVEA MicellAIR film">
        <video data-auto muted loop playsinline preload="none" data-src="media/nivea/nivea-loop.mp4" poster="media/nivea/nivea-loop.webp"></video>
      </button>
      <div class="film__cap"><span>NIVEA MicellAIR</span><span class="muted">Launch film — click to watch with sound</span></div>
    </div>
  </section>

'''

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fadi Awwad — Creative Director · UI/UX · Toronto</title>
<meta name="description" content="Fadi Awwad is a Toronto-based Creative Director with 17+ years across brand, campaign and UI/UX design for multinational clients.">
<meta property="og:title" content="Fadi Awwad — Creative Director">
<meta property="og:description" content="Brand, campaign and UI/UX design. 17+ years. Toronto · Dubai · Amman.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://fadiawwad.com/">
<meta property="og:image" content="https://fadiawwad.com/media/og.jpg">
<meta name="theme-color" content="#0a0a0a">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="favicon.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css?v={VER}">
</head>
<body>
<div class="intro" aria-hidden="true"><div class="intro__name"><span>Fadi Awwad</span></div><div class="intro__count">000</div></div>
<div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>

<header class="header">
  <a href="#top" class="logo">Fadi Awwad<sup>®</sup></a>
  <button class="menu-btn" aria-expanded="false" aria-controls="menu"><span class="menu-btn__text">Menu</span><span class="menu-btn__icon"></span></button>
</header>

<div class="menu" id="menu" data-dark>
  <nav aria-label="Main">
    <a href="#work"><span>Work</span></a>
    <a href="work.html"><span>All projects</span></a>
    <a href="#awards"><span>Awards</span></a>
    <a href="#contact"><span>Contact</span></a>
  </nav>
  <div class="menu__foot"><span>{EMAIL}</span><span>Toronto, Canada</span></div>
</div>

<main id="top">
  <section class="hero">
    <p class="hero__intro">— a Creative Director shaping brands and digital products through bold ideas, clear systems and obsessive craft. Based in Toronto, working with teams worldwide.</p>
    <p class="hero__meta">Creative Director — UI/UX<br><span class="muted">Toronto, Canada</span></p>
    <div class="stack" data-cursor="view" data-cursor-text="Work">{cards_html}</div>
    <h1 class="hero__name display"><span class="line"><span data-fit="1">Fadi Awwad</span></span></h1>
    <div class="hero__foot"><span>Creative Director · Brand · Campaign · UI/UX</span><span class="scroll-hint"><i></i>Scroll</span><span>© 2026</span></div>
  </section>

  <section class="statement">
    <p class="statement__text" data-accent="actually remember">I turn ambitious ideas into brands, campaigns and digital products people actually remember — from the first sketch to the final pixel.</p>
  </section>


  <section class="work" id="work">
    <div class="work__head">
      <h2 class="kern-title"><span class="reveal"><span>The good</span></span><span class="reveal"><span class="acc">stuff.</span></span></h2>
      <p class="muted">UI/UX, brand and campaign work for global brands. Pick a project to see the full story.</p>
    </div>
    <div class="work__filters" role="group" aria-label="Filter projects">
      <button class="chip is-on" data-filter="all">All <sup>{len(FEATURED)}</sup></button>
      {f'<button class="chip" data-filter="ui">UI/UX <sup>{_n}</sup></button>' if (_n := sum("ui" in p["cat"] for p in FEATURED)) else ""}
      {f'<button class="chip" data-filter="brand">Brand <sup>{_n}</sup></button>' if (_n := sum("brand" in p["cat"] for p in FEATURED)) else ""}
      {f'<button class="chip" data-filter="campaign">Campaign <sup>{_n}</sup></button>' if (_n := sum("campaign" in p["cat"] for p in FEATURED)) else ""}
    </div>
    <div class="cards">{cards}
    </div>
    <div class="work__more">{fx(f"View all projects ({len(PROJECTS):02d})", attrs='href="work.html"')}</div>
  </section>

{OUTLINE}

  <section class="caps2" id="services" aria-label="What I do">
    <div class="caps2__sticky">
      <div class="caps2__left">
        <h2 class="eyebrow">What I do</h2>
        <ol class="caps2__list">{caps_list}</ol>
        <div class="caps2__progress"><i></i></div>
      </div>
      <div class="caps2__right">{caps_panels}</div>
      <div class="caps2__dots" aria-hidden="true">{"".join("<i></i>" for _ in SERVICES)}</div>
    </div>
  </section>
{wall_html() if SHOW_WALL else ""}

{FILM if SHOW_NIVEA else ""}

{PROGRESS_FEATURE if SHOW_BOUNTEOUS else ""}
{MASARAT_FEATURE}


  <section class="brands" aria-label="Clients">
    <div class="brands__sticky">
      <h2 class="brands__title display">Brands I’ve<br>worked with</h2>
      <ul class="brands__grid">{logos}</ul>
      <p class="brands__note muted">Global names across tech, automotive, FMCG, finance and hospitality.</p>
    </div>
  </section>

  <section class="awards" id="awards">
    <div class="awards__top"><h2 class="eyebrow">Awards <span class="muted">({len(AWARDS):02d})</span></h2><p class="muted">Recognised by regional and global juries for craft and ideas.</p></div>
    <ul class="aw-list">{awards_html}</ul>
  </section>

{MADA_FEATURE}
{DFIN_FEATURE if SHOW_BOUNTEOUS else ""}
</main>

<footer class="contact" id="contact" data-dark>
  <span class="eyebrow">Contact</span>
  <h2 class="contact__title"><span class="reveal"><span>Let’s make</span></span><span class="reveal"><span>something</span></span><span class="reveal"><span>remarkable.</span></span></h2>
  <div class="contact__actions">
    {fx(EMAIL, attrs=f'href="mailto:{EMAIL}"', dark=True)}
    <button class="btn btn--ghost" data-copy="{EMAIL}">Copy email</button>
    <span class="copy-note" aria-live="polite"></span>
  </div>
  <div class="contact__grid">
    <div><span>Email</span><a href="mailto:{EMAIL}">{EMAIL}</a></div>
    <div><span>Based in</span>Toronto, Canada<br><span style="display:inline;margin:0" data-clock></span></div>
    {phone_html}
    <div><span>Languages</span>English · Arabic</div>
  </div>
  <p class="footer-name display"><span class="line"><span data-fit="1">Fadi Awwad</span></span></p>
  <div class="footer-bar"><span>© 2026 Fadi Awwad. All rights reserved.</span><a href="#top" class="to-top">Back to top ↑</a></div>
</footer>

<div class="viewer" role="dialog" aria-modal="true" aria-label="Project" data-lenis-prevent hidden>
  <div class="viewer__bar">
    <span class="viewer__count"><b>01</b> / {len(PROJECTS):02d}</span>
    <div class="viewer__nav">
      <button class="viewer__prev" aria-label="Previous project">← Prev</button>
      <button class="viewer__next" aria-label="Next project">Next →</button>
      <button class="viewer__close" aria-label="Close project">Close <span aria-hidden="true">✕</span></button>
    </div>
  </div>
  <div class="viewer__scroll">{viewer}
  </div>
</div>

<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" data-dark>
  <button class="lightbox__close">Close ✕</button>
  <img alt="">
  <div class="lightbox__nav"><button class="lightbox__prev">← Prev</button><span class="lightbox__count"></span><button class="lightbox__next">Next →</button></div>
</div>

<script src="https://unpkg.com/lenis@1.1.20/dist/lenis.min.js"></script>
<script src="js/main.js?v={VER}"></script>
</body>
</html>
'''
(ROOT / "index.html").write_text(page)

# ---------------------------------------------------------------- All projects page
head = page[:page.index('<main id="top">')]
tail = page[page.index('</main>') + len('</main>'):]
head = head.replace('<title>Fadi Awwad — Creative Director · UI/UX · Toronto</title>', '<title>All projects — Fadi Awwad</title>')
for a in ['#work', '#awards']:
    head = head.replace(f'<a href="{a}">', f'<a href="index.html{a}">')
head = head.replace('<div class="intro" aria-hidden="true"><div class="intro__name"><span>Fadi Awwad</span></div><div class="intro__count">000</div></div>', '')
head = head.replace('<a href="#top" class="logo">', '<a href="index.html" class="logo">')
def chip(label, f, n, on=False):
    return f'<button class="chip{" is-on" if on else ""}" data-filter="{f}">{label} <sup>{n}</sup></button>'
chips = chip("All", "all", len(PROJECTS), True) + "".join(chip(l, c, sum(c in p["cat"] for p in PROJECTS)) for l, c in [("UI/UX", "ui"), ("Brand", "brand"), ("Campaign", "campaign")])
work_main = f'''<main id="top" class="allwork">
  <section class="allwork__head">
    <a class="allwork__back" href="index.html">← Back to home</a>
    <h1 class="allwork__title display"><span class="reveal"><span>All projects<sup class="wall__count">({len(PROJECTS):02d})</sup></span></span></h1>
    <p class="muted">Brand, campaign and UI/UX work across 17+ years. Pick a project to see the full story.</p>
  </section>
  <div class="work__filters" role="group" aria-label="Filter projects">{chips}</div>
  <div class="cards4">{cards_all}
  </div>
</main>'''
(ROOT / "work.html").write_text(head + work_main + tail)
print("wrote", ROOT / "work.html")
print("wrote", ROOT / "index.html", len(page))
