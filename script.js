/* GNT Officine Meccaniche — script proprio dei mockup (tecniche 19, 21, 23–26 e 28 della raccomandazione §7).
   Nessuna libreria. Tutto ciò che fa è un'aggiunta: senza JavaScript la pagina è completa (poster fermo, barre piene, menu
   e tendine come link, gallerie che scorrono). Con «riduci il movimento» non avvia il video e non osserva le comparse. */
(function () {
  "use strict";
  var doc = document;
  var html = doc.documentElement;
  html.classList.add("js");
  var ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var osservaSupportato = "IntersectionObserver" in window;

  /* Tecnica 23: comparsa al primo ingresso (solo gli elementi che portano .compare) */
  if (osservaSupportato && !ridotto) {
    var oc = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add("visto"); oc.unobserve(v.target); } });
    }, { threshold: 0.15 });
    doc.querySelectorAll(".compare").forEach(function (e) { oc.observe(e); });
  } else {
    doc.querySelectorAll(".compare").forEach(function (e) { e.classList.add("visto"); });
  }

  /* Tecnica 21: la corsa. Dove animation-timeline manca, la barra cresce una volta all'ingresso della riga */
  var barre = doc.querySelectorAll(".numero-gigante--barra .numero-gigante__riga");
  if (barre.length) {
    if (CSS.supports("animation-timeline: view()") || !osservaSupportato || ridotto) {
      barre.forEach(function (r) { r.classList.add("visto"); });
    } else {
      var ob = new IntersectionObserver(function (voci) {
        voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add("visto"); ob.unobserve(v.target); } });
      }, { threshold: 0.6 });
      barre.forEach(function (r) { ob.observe(r); });
    }
  }

  /* Tecnica 24: il pulsante dell'intestazione diventa pieno quando l'apertura esce dalla finestra, solo dove la pagina lo chiede */
  var testata = doc.querySelector(".intestazione");
  var apertura = doc.querySelector(".apertura");
  if (testata && apertura && apertura.hasAttribute("data-pieno-dopo-apertura") && osservaSupportato) {
    var oa = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { testata.classList.toggle("intestazione--pieno", !v.isIntersecting); });
    }, { threshold: 0 });
    oa.observe(apertura);
  }

  /* Tecnica 25: menu a schermo intero sotto 1280 (<dialog>) */
  var apri = doc.querySelector(".intestazione__apri");
  var menu = doc.getElementById("menu-intero");
  if (apri && menu && typeof menu.showModal === "function") {
    apri.addEventListener("click", function () { menu.showModal(); apri.setAttribute("aria-expanded", "true"); });
    menu.addEventListener("close", function () { apri.setAttribute("aria-expanded", "false"); apri.focus(); });
    menu.querySelectorAll(".intestazione__chiudi").forEach(function (b) { b.addEventListener("click", function () { menu.close(); }); });
  }

  /* Tecnica 26: tendine al clic, chiusura con Esc e clic fuori */
  var voci = doc.querySelectorAll(".menu__voce[aria-expanded]");
  function chiudiTendine(eccetto) {
    voci.forEach(function (v) { if (v !== eccetto) v.setAttribute("aria-expanded", "false"); });
  }
  voci.forEach(function (v) {
    v.addEventListener("click", function (ev) {
      ev.preventDefault();
      var aperta = v.getAttribute("aria-expanded") === "true";
      chiudiTendine(v);
      v.setAttribute("aria-expanded", aperta ? "false" : "true");
    });
  });
  doc.addEventListener("keydown", function (ev) { if (ev.key === "Escape") chiudiTendine(); });
  doc.addEventListener("click", function (ev) { if (!ev.target.closest(".menu > li")) chiudiTendine(); });

  /* Tecnica 19: il video di apertura parte dopo load, da 768 px, non con «riduci il movimento»; pausa fuori schermo; pulsante Pausa/Riprendi */
  doc.querySelectorAll(".video--apertura").forEach(function (blocco) {
    var video = blocco.querySelector(".video__file");
    var pausa = blocco.querySelector(".video__pausa");
    if (!video || ridotto || window.innerWidth < 768) return;
    var inPausa = false;
    function avvia() {
      var webm = video.getAttribute("data-webm"), mp4 = video.getAttribute("data-mp4");
      if (webm) { var s1 = doc.createElement("source"); s1.src = webm; s1.type = "video/webm"; video.appendChild(s1); }
      if (mp4) { var s2 = doc.createElement("source"); s2.src = mp4; s2.type = "video/mp4"; video.appendChild(s2); }
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      video.addEventListener("playing", function () { blocco.classList.add("video--attivo", "video--pronto"); }, { once: true });
    }
    if (doc.readyState === "complete") avvia(); else window.addEventListener("load", avvia, { once: true });
    if (pausa) {
      pausa.addEventListener("click", function () {
        inPausa = !inPausa;
        if (inPausa) { video.pause(); } else { video.play(); }
        pausa.textContent = inPausa ? pausa.getAttribute("data-riprendi") : pausa.getAttribute("data-pausa");
        pausa.setAttribute("aria-label", inPausa ? pausa.getAttribute("data-aria-riprendi") : pausa.getAttribute("data-aria-pausa"));
        pausa.setAttribute("aria-pressed", inPausa ? "true" : "false");
      });
    }
    if (osservaSupportato) {
      var ov = new IntersectionObserver(function (v) {
        v.forEach(function (x) { if (inPausa) return; if (x.isIntersecting) { video.play().catch && video.play().catch(function () {}); } else { video.pause(); } });
      }, { threshold: 0 });
      ov.observe(blocco);
    }
  });

  /* Tecnica 28: gallerie a scorrimento, contatore in aria-live e pulsanti veri */
  doc.querySelectorAll(".galleria--scorrevole").forEach(function (g) {
    var lista = g.querySelector(".galleria__lista");
    var voci2 = lista ? lista.children : [];
    var cont = g.querySelector(".galleria__contatore");
    var prec = g.querySelector("[data-prec]"), succ = g.querySelector("[data-succ]");
    if (!lista || !voci2.length) return;
    function indice() { var w = voci2[0].getBoundingClientRect().width + 16; return Math.min(voci2.length, Math.round(lista.scrollLeft / w) + 1); }
    function aggiorna() { if (cont) cont.textContent = indice() + " / " + voci2.length; }
    lista.addEventListener("scroll", aggiorna, { passive: true });
    function vai(d) { var w = voci2[0].getBoundingClientRect().width + 16; lista.scrollBy({ left: d * w, behavior: ridotto ? "auto" : "smooth" }); }
    if (prec) prec.addEventListener("click", function () { vai(-1); });
    if (succ) succ.addEventListener("click", function () { vai(1); });
    aggiorna();
  });

  /* Facciata della mappa: nel mockup il pulsante non carica terze parti; mostra l'avviso di stato di sistema.md §7 */
  doc.querySelectorAll(".facciata-mappa__carica").forEach(function (b) {
    b.addEventListener("click", function () { b.textContent = b.getAttribute("data-caricamento"); b.setAttribute("aria-disabled", "true"); });
  });

  /* Banner dei cookie: nel mockup il banner è aperto all'arrivo; i pulsanti lo chiudono; «Preferenze cookie» nel piè lo riapre */
  var cookie = doc.querySelector(".cookie");
  if (cookie) {
    cookie.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { cookie.classList.remove("cookie--aperto"); }); });
    doc.querySelectorAll("[data-track='cookie-preferenze']").forEach(function (b) { b.addEventListener("click", function () { cookie.classList.add("cookie--aperto"); }); });
  }
})();
