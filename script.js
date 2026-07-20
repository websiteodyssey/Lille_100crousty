/* =====================================================================
   100% CROUSTI LILLE — interactions (JavaScript natif, sans dépendance)
   Toutes les données réelles sont centralisées dans SITE_CONFIG.
   ===================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------
     URLs des deux sites (à remplacer par les URLs publiques finales)
     -------------------------------------------------------------- */
  // TODO : remplacer par l'URL publique définitive du site général 100% Crousti
  const GENERAL_WEBSITE_URL = "https://crousti.fr/";
  // TODO : remplacer par l'URL publique définitive de la page "Nos restaurants"
  const RESTAURANTS_URL = "https://crousti.fr/nos-restaurants.html";

  /* --------------------------------------------------------------
     Configuration centralisée du restaurant de Lille
     -------------------------------------------------------------- */
  const SITE_CONFIG = {
    generalWebsiteUrl: GENERAL_WEBSITE_URL,
    restaurant: {
      name: "100% Crousti Original Lille",
      address: "3 rue des Sarrazins, 59000 Lille",
      phone: "tel:+33320477524",
      latitude: 50.6254,
      longitude: 3.0491,
    },
    links: {
      // Liens exacts vérifiés vers le restaurant de Lille (quartier Gambetta)
      uberEats: "https://www.ubereats.com/fr/store/100-crousti-original-lille/ez-Ovcp-Vr2Y8bleFnpLsw",
      deliveroo: "https://deliveroo.fr/fr/menu/lille/lille-gambetta/100-crousti-lille",
      // Lien de secours Google Maps (fiche exacte non confirmée) — recherche ciblée sur l'adresse
      directions: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("100% Crousti Original, 3 rue des Sarrazins, 59000 Lille"),
      reviews: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("100% Crousti Original 3 rue des Sarrazins 59000 Lille"),
      phone: "tel:+33320477524",
      general: GENERAL_WEBSITE_URL,
      restaurants: RESTAURANTS_URL,
    },
    google: {
      // Non affichés tant qu'ils ne sont pas confirmés sur la fiche Google officielle actuelle
      rating: null,
      reviewCount: null,
      lastVerified: "",
    },
  };

  const LILLE_COORDINATES = { lat: 50.6254, lng: 3.0491 };
  const LILLE_MAP_ZOOM = 16;

  // TODO : confirmer les horaires exacts avec 100% Crousti Lille (valeur provisoire = standard de l'enseigne)
  const HOURS_VERIFIED = false; // passe à true une fois les horaires confirmés → active le badge Ouvert/Fermé
  const LILLE_OPENING_HOURS = [
    { day: "Lundi",    hours: "11 h 00 – 23 h 00" },
    { day: "Mardi",    hours: "11 h 00 – 23 h 00" },
    { day: "Mercredi", hours: "11 h 00 – 23 h 00" },
    { day: "Jeudi",    hours: "11 h 00 – 23 h 00" },
    { day: "Vendredi", hours: "11 h 00 – 23 h 00" },
    { day: "Samedi",   hours: "11 h 00 – 23 h 00" },
    { day: "Dimanche", hours: "11 h 00 – 23 h 00" },
  ];

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* --------------------------------------------------------------
     1. Résolution centralisée des liens ([data-link])
     -------------------------------------------------------------- */
  $$("[data-link]").forEach((el) => {
    const key = el.dataset.link;
    const url = SITE_CONFIG.links[key];
    if (url) {
      el.setAttribute("href", url);
    } else {
      // Lien non confirmé : on masque proprement l'élément (aucun faux lien)
      el.setAttribute("hidden", "");
      el.setAttribute("aria-hidden", "true");
    }
  });

  /* --------------------------------------------------------------
     2. Menu mobile
     -------------------------------------------------------------- */
  const header = $("#siteHeader");
  const toggle = $("[data-menu-toggle]");
  if (header && toggle) {
    const nav = $("#mainNav");
    const setOpen = (open) => {
      header.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      document.body.style.overflow = open ? "hidden" : ""; // bloque le scroll derrière le menu plein écran
    };
    toggle.addEventListener("click", () => setOpen(!header.classList.contains("open")));
    // Sécurité : si on repasse en desktop, on referme et on déverrouille le scroll
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024 && header.classList.contains("open")) setOpen(false);
    });
    if (nav) {
      nav.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => setOpen(false))
      );
    }
    // Échap ferme le menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("open")) { setOpen(false); toggle.focus(); }
    });
  }

  /* --------------------------------------------------------------
     3. Modale de commande (focus trap + Échap + restauration du focus)
     -------------------------------------------------------------- */
  const modal = $("#orderModal");
  if (modal) {
    let lastFocus = null;
    const dialog = $(".modal-dialog", modal);
    const focusablesSel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const openModal = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      const first = $(focusablesSel, dialog);
      if (first) first.focus();
    };
    const closeModal = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    };

    $$("[data-order-open]").forEach((btn) =>
      btn.addEventListener("click", (e) => { e.preventDefault(); openModal(); })
    );
    $$("[data-modal-close]", modal).forEach((el) =>
      el.addEventListener("click", closeModal)
    );
    // Un choix de commande ferme la modale (le lien s'ouvre dans un nouvel onglet)
    $$(".order-choice", modal).forEach((a) =>
      a.addEventListener("click", () => setTimeout(closeModal, 60))
    );
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key !== "Tab") return;
      const f = $$(focusablesSel, dialog).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* --------------------------------------------------------------
     4. Carrousel "Nos incontournables"
     -------------------------------------------------------------- */
  const track = $("#productsTrack");
  if (track) {
    const prev = $('[data-carousel="prev"]');
    const next = $('[data-carousel="next"]');
    const step = () => {
      const card = track.querySelector(".product");
      if (!card) return track.clientWidth * 0.8;
      const gap = parseFloat(getComputedStyle(track).columnGap || "22") || 22;
      return card.offsetWidth + gap;
    };
    const scrollByStep = (dir) =>
      track.scrollBy({ left: dir * step(), behavior: prefersReduced ? "auto" : "smooth" });
    if (prev) prev.addEventListener("click", () => scrollByStep(-1));
    if (next) next.addEventListener("click", () => scrollByStep(1));

    const updateBtns = () => {
      const max = track.scrollWidth - track.clientWidth - 4;
      const canScroll = max > 4;
      if (prev) prev.disabled = !canScroll || track.scrollLeft <= 4;
      if (next) next.disabled = !canScroll || track.scrollLeft >= max;
    };
    track.addEventListener("scroll", () => window.requestAnimationFrame(updateBtns), { passive: true });
    window.addEventListener("resize", updateBtns);
    window.addEventListener("load", updateBtns);
    // Les images changent la largeur du contenu une fois chargées : on recalcule
    track.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", updateBtns, { once: true });
    });
    updateBtns();
    window.setTimeout(updateBtns, 300);

    // Clavier : flèches gauche/droite quand la liste a le focus
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollByStep(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); scrollByStep(-1); }
    });
  }

  /* --------------------------------------------------------------
     5. Galerie — lightbox accessible
     -------------------------------------------------------------- */
  const gallery = $("#gallery");
  if (gallery) {
    const figures = $$(".gallery-item", gallery).map((fig) => {
      const img = $("img", fig);
      const cap = $("figcaption", fig);
      return { src: img ? img.src : "", alt: img ? img.alt : "", cap: cap ? cap.textContent : "" };
    }).filter((f) => f.src);

    // Construction de la lightbox
    const lb = document.createElement("div");
    lb.className = "lightbox"; lb.hidden = true;
    lb.innerHTML =
      '<div class="lightbox-backdrop" data-lb-close></div>' +
      '<button class="lightbox-close" type="button" aria-label="Fermer" data-lb-close>×</button>' +
      '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Image précédente">‹</button>' +
      '<figure class="lightbox-figure"><img alt=""><figcaption class="lightbox-cap"></figcaption></figure>' +
      '<button class="lightbox-btn lightbox-next" type="button" aria-label="Image suivante">›</button>';
    document.body.appendChild(lb);

    const lbImg = $("img", lb), lbCap = $(".lightbox-cap", lb);
    const btnPrev = $(".lightbox-prev", lb), btnNext = $(".lightbox-next", lb), btnClose = $(".lightbox-close", lb);
    let idx = 0, lastFocus = null;

    const render = () => {
      const it = figures[idx];
      lbImg.src = it.src; lbImg.alt = it.alt; lbCap.textContent = it.cap;
    };
    const openLb = (i) => {
      idx = i; lastFocus = document.activeElement; render();
      lb.hidden = false; document.body.style.overflow = "hidden"; btnClose.focus();
    };
    const closeLb = () => {
      lb.hidden = true; document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    const move = (d) => { idx = (idx + d + figures.length) % figures.length; render(); };

    $$(".gallery-open", gallery).forEach((btn, i) =>
      btn.addEventListener("click", () => openLb(i))
    );
    btnPrev.addEventListener("click", () => move(-1));
    btnNext.addEventListener("click", () => move(1));
    $$("[data-lb-close]", lb).forEach((el) => el.addEventListener("click", closeLb));
    lb.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "Tab") { e.preventDefault(); } // focus maintenu dans la lightbox
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.hidden && e.key === "Escape") closeLb();
    });
  }

  /* --------------------------------------------------------------
     6. Horaires + statut Ouvert/Fermé (Europe/Paris)
     -------------------------------------------------------------- */
  const hoursBody = $("#hours tbody");
  if (hoursBody) {
    // Ordre JS getDay() : 0=Dimanche … 6=Samedi → index dans LILLE_OPENING_HOURS (Lundi=0)
    const jsDayToIndex = [6, 0, 1, 2, 3, 4, 5];
    let todayIndex = -1;
    try {
      const parisDay = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" }).format(new Date());
      const map = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
      todayIndex = map[parisDay] != null ? map[parisDay] : jsDayToIndex[new Date().getDay()];
    } catch (_) { todayIndex = jsDayToIndex[new Date().getDay()]; }

    hoursBody.innerHTML = LILLE_OPENING_HOURS.map((h, i) =>
      `<tr class="${i === todayIndex ? "today" : ""}"><td class="day">${h.day}</td><td class="val">${h.hours || "—"}</td></tr>`
    ).join("");

    const note = $("#hoursNote");
    if (note) note.textContent = "Horaires indicatifs, susceptibles de variations selon les jours.";

    // Badge Ouvert/Fermé : uniquement si les horaires sont confirmés fiables
    if (HOURS_VERIFIED) {
      try {
        const now = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
        const [hh, mm] = now.split(":").map(Number);
        const minutes = hh * 60 + mm;
        const isOpen = minutes >= 11 * 60 && minutes < 23 * 60; // 11h00–23h00
        const block = $("#informations .infos-block");
        if (block) {
          const badge = document.createElement("span");
          badge.className = "status-badge " + (isOpen ? "open" : "closed");
          badge.innerHTML = '<span class="dot"></span>' + (isOpen ? "Ouvert maintenant" : "Fermé actuellement");
          block.insertBefore(badge, block.firstChild);
        }
      } catch (_) { /* pas de badge si le calcul échoue */ }
    }
  }

  /* --------------------------------------------------------------
     7. Avis Google (affichés uniquement si vérifiés)
     -------------------------------------------------------------- */
  const reviewsBody = $("#reviewsBody");
  if (reviewsBody && SITE_CONFIG.google.rating != null && SITE_CONFIG.google.reviewCount != null) {
    const r = SITE_CONFIG.google.rating, c = SITE_CONFIG.google.reviewCount;
    const pct = Math.max(0, Math.min(100, (r / 5) * 100)).toFixed(0) + "%";
    const wrap = document.createElement("div");
    wrap.className = "reviews-rating";
    wrap.innerHTML =
      `<span class="reviews-score">${String(r).replace(".", ",")}</span>` +
      `<span class="reviews-stars" style="--pct:${pct}" role="img" aria-label="Note ${r} sur 5">★★★★★</span>` +
      `<span class="reviews-count">${c} avis Google</span>`;
    reviewsBody.insertBefore(wrap, reviewsBody.firstChild);
  }

  /* --------------------------------------------------------------
     8. Carte Leaflet
     -------------------------------------------------------------- */
  const mapEl = $("#map");
  if (mapEl && window.L) {
    const L = window.L;
    const map = L.map(mapEl, {
      zoomControl: false, scrollWheelZoom: false, dragging: true, touchZoom: true,
      doubleClickZoom: true, keyboard: true, tap: true, inertia: true,
    }).setView([LILLE_COORDINATES.lat, LILLE_COORDINATES.lng], LILLE_MAP_ZOOM);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap, © CARTO", maxZoom: 19,
    }).addTo(map);

    const pin = L.divIcon({
      className: "",
      html: '<div style="width:20px;height:20px;background:#FF5BA6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(255,91,166,.3)"></div>',
      iconSize: [20, 20], iconAnchor: [10, 10],
    });
    const popupHtml =
      '<div class="map-popup">' +
        "<strong>100% Crousti Original Lille</strong>" +
        "<span>3 rue des Sarrazins, 59000 Lille</span>" +
        '<a href="' + SITE_CONFIG.links.directions + '" target="_blank" rel="noopener">Obtenir l\'itinéraire</a>' +
      "</div>";
    L.marker([LILLE_COORDINATES.lat, LILLE_COORDINATES.lng], { icon: pin, title: SITE_CONFIG.restaurant.name })
      .addTo(map).bindPopup(popupHtml).openPopup();

    // La molette zoome uniquement après un clic sur la carte (ne bloque pas le scroll de la page)
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());

    if ("IntersectionObserver" in window) {
      const mo = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { map.invalidateSize(); mo.disconnect(); } });
      }, { threshold: 0.1 });
      mo.observe(mapEl);
    }
    window.setTimeout(() => map.invalidateSize(), 400);
  }

  /* --------------------------------------------------------------
     9. Révélations au scroll (IntersectionObserver)
     -------------------------------------------------------------- */
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el, i) => {
      const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = (Math.min(sib, 6) * 0.06) + "s";
      io.observe(el);
    });
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in-view"));
  }

  /* --------------------------------------------------------------
     10. Barre de progression + parallaxe légère
     -------------------------------------------------------------- */
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.appendChild(progress);

  const parallaxEls = $$("[data-parallax]");
  const parallaxBg = $$("[data-parallax-bg]");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const sc = window.scrollY || window.pageYOffset;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (docH > 0 ? sc / docH : 0) + ")";
      if (!prefersReduced) {
        const vh = window.innerHeight;
        parallaxEls.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0.1;
          const rect = el.getBoundingClientRect();
          const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
          el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
        });
        parallaxBg.forEach((el) => {
          const speed = parseFloat(el.dataset.parallaxBg) || 0.12;
          const rect = el.getBoundingClientRect();
          if (rect.bottom < -200 || rect.top > vh + 200) return;
          const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
          el.style.setProperty("--pary", offset.toFixed(1) + "px");
        });
      }
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------------------
     11. Mascotte du hero — poses au clic + suivi du curseur
     -------------------------------------------------------------- */
  const heroMascot = $("#heroMascot");
  const heroMascotImg = $("#heroMascotImg");
  const heroTilt = $("#heroMascotTilt");
  const heroReact = $("#heroMascotReact");
  if (heroMascot && heroMascotImg) {
    const POSES = [
      "./assets/mascotte/pose-1.png", "./assets/mascotte/pose-2.png", "./assets/mascotte/pose-3.png",
      "./assets/mascotte/pose-4.png", "./assets/mascotte/pose-5.png", "./assets/mascotte/pose-6.png",
    ];
    POSES.forEach((src) => { const i = new Image(); i.src = src; });
    let pose = 0;
    heroMascot.addEventListener("click", () => {
      pose = (pose + 1) % POSES.length;
      heroMascotImg.src = POSES[pose];
      if (heroReact && !prefersReduced) {
        heroReact.classList.remove("pop"); void heroReact.offsetWidth; heroReact.classList.add("pop");
      }
    });
    if (heroReact) {
      heroReact.addEventListener("animationend", () => heroReact.classList.remove("pop"));
    }

    if (heroTilt && !prefersReduced) {
      const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
      let tx = 0, ty = 0, cx = 0, cy = 0;
      const frame = () => {
        cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
        heroTilt.style.setProperty("--rx", (cx * 14).toFixed(2) + "deg");
        heroTilt.style.setProperty("--ry", (-cy * 9).toFixed(2) + "deg");
        heroTilt.style.setProperty("--tx", (cx * 12).toFixed(2) + "px");
        heroTilt.style.setProperty("--ty", (cy * 12).toFixed(2) + "px");
        window.requestAnimationFrame(frame);
      };
      window.requestAnimationFrame(frame);
      window.addEventListener("pointermove", (e) => {
        const r = heroMascot.getBoundingClientRect();
        tx = clamp((e.clientX - (r.left + r.width / 2)) / Math.max(r.width, innerWidth * 0.5), -1, 1);
        ty = clamp((e.clientY - (r.top + r.height / 2)) / Math.max(r.height, innerHeight * 0.5), -1, 1);
      }, { passive: true });
      document.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    }
  }

  /* --------------------------------------------------------------
     12. Année du footer
     -------------------------------------------------------------- */
  const year = $("#year");
  if (year) {
    try { year.textContent = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric" }).format(new Date()); }
    catch (_) { year.textContent = String(new Date().getFullYear()); }
  }
})();
