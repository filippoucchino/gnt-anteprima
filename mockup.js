/* Comportamenti dei componenti nei mockup, senza librerie: intestazione (menu a schermo intero, pannello «Lavorazioni», tendina
   «Sedi»), video della prima schermata con la pausa, galleria (frecce, contatore, barra), facciata (caricamento al clic), modulo
   (validazione, stati di invio, conferma simulata: il mockup non ha un server), cookie (banner e pannello), comparsa dei blocchi dove
   il browser non ha le animazioni legate allo scorrimento. La fase 11 divide il file per componente e aggiunge il tracciamento. */
(function () {
  "use strict";
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var movimentoRidotto = window.matchMedia("(prefers-reduced-motion: reduce)");
  var largo = window.matchMedia("(min-width: 1200px)");

  /* intestazione: pannello e tendina (da 1200 px uno alla volta; nel menu sotto 1200 px già aperti) */
  var apri = $$(".intestazione__apri");
  function chiudiTendine(tranne) { apri.forEach(function (b) { if (b !== tranne) b.setAttribute("aria-expanded", "false"); }); }
  apri.forEach(function (b) {
    b.addEventListener("click", function () {
      var aperto = b.getAttribute("aria-expanded") === "true";
      if (largo.matches) chiudiTendine(b);
      b.setAttribute("aria-expanded", String(!aperto));
    });
    var voce = b.parentElement;
    voce.addEventListener("focusout", function (e) { if (largo.matches && !voce.contains(e.relatedTarget)) b.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("click", function (e) { if (largo.matches && !e.target.closest(".intestazione__voce")) chiudiTendine(); });

  /* intestazione: menu a schermo intero sotto 1200 px, con il fuoco che resta dentro e lo scorrimento della pagina bloccato */
  var menu = $(".intestazione__menu");
  var nav = $("#menu-principale");
  function apriMenu(apertura) {
    menu.setAttribute("aria-expanded", String(apertura));
    $(".intestazione__menu-testo", menu).textContent = apertura ? "Chiudi il menu" : "Menu";
    document.documentElement.style.overflow = apertura ? "hidden" : "";
    apri.forEach(function (b) { b.setAttribute("aria-expanded", String(apertura)); });
    if (apertura) { var primo = $("a, button", nav); if (primo) primo.focus(); }
  }
  if (menu && nav) {
    menu.addEventListener("click", function () { apriMenu(menu.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      var menuAperto = menu.getAttribute("aria-expanded") === "true";
      if (e.key === "Escape") {
        if (menuAperto) { apriMenu(false); menu.focus(); return; }
        var aperto = apri.filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
        if (aperto) { aperto.setAttribute("aria-expanded", "false"); aperto.focus(); }
      }
      if (e.key === "Tab" && menuAperto) {
        var fuochi = $$("a, button", nav).filter(function (x) { return x.offsetParent !== null; }).concat([menu]);
        var i = fuochi.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); fuochi[fuochi.length - 1].focus(); }
        else if (!e.shiftKey && (i === fuochi.length - 1 || i < 0)) { e.preventDefault(); fuochi[0].focus(); }
      }
    });
    largo.addEventListener("change", function () { if (largo.matches && menu.getAttribute("aria-expanded") === "true") apriMenu(false); chiudiTendine(); });
  }

  /* video della prima schermata: parte dopo il caricamento, solo da 768 px, senza «riduci il movimento» e senza Save-Data;
     se non si carica resta l'immagine, senza messaggi; il pulsante di pausa compare solo mentre il video è attivo */
  window.addEventListener("load", function () {
    var risparmio = navigator.connection && navigator.connection.saveData;
    $$(".hero__video").forEach(function (v) {
      if (risparmio || movimentoRidotto.matches || !window.matchMedia("(min-width: 768px)").matches) return;
      var pausa = $(".hero__pausa", v.parentElement);
      [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (s) {
        var src = v.getAttribute("data-" + s[0]); if (!src) return;
        var el = document.createElement("source"); el.src = src; el.type = s[1]; v.appendChild(el);
      });
      var sorgenti = $$("source", v);
      if (!sorgenti.length) return;
      sorgenti[sorgenti.length - 1].addEventListener("error", function () { v.remove(); if (pausa) pausa.remove(); });
      v.addEventListener("playing", function () { v.setAttribute("data-attivo", ""); if (pausa) pausa.hidden = false; }, { once: true });
      v.load();
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      if (pausa) pausa.addEventListener("click", function () {
        var inPausa = !v.paused;
        if (inPausa) v.pause(); else v.play();
        pausa.setAttribute("aria-pressed", String(inPausa));
        pausa.setAttribute("aria-label", pausa.getAttribute(inPausa ? "data-riprendi" : "data-pausa"));
        $(".icona--pausa", pausa).hidden = inPausa; $(".icona--riprendi", pausa).hidden = !inPausa;
      });
    });
  });
  movimentoRidotto.addEventListener("change", function () { if (movimentoRidotto.matches) $$(".hero__video").forEach(function (v) { v.pause(); }); });

  /* galleria: frecce, contatore, barra di avanzamento, stato «tutto visibile» */
  $$(".galleria").forEach(function (g) {
    var binario = $(".galleria__binario", g);
    var voci = $$(".galleria__voce", g);
    var contatore = $(".galleria__contatore", g);
    var barra = $(".galleria__avanzamento", g);
    if (!binario || !voci.length) return;
    function passo() { return voci[0].getBoundingClientRect().width + parseFloat(getComputedStyle(binario).columnGap || 0); }
    function aggiorna() {
      var tutto = binario.scrollWidth <= binario.clientWidth + 2;
      g.classList.toggle("galleria--completa", tutto);
      if (tutto) return;
      var i = Math.min(voci.length, Math.round(binario.scrollLeft / passo()) + 1);
      if (contatore) contatore.textContent = i + " / " + voci.length;
      if (barra) barra.style.setProperty("--avanzamento", String(i / voci.length));
    }
    binario.addEventListener("scroll", aggiorna, { passive: true });
    window.addEventListener("resize", aggiorna);
    $$(".galleria__freccia", g).forEach(function (f) {
      f.addEventListener("click", function () {
        binario.scrollBy({ left: f.classList.contains("galleria__freccia--succ") ? passo() : -passo(), behavior: movimentoRidotto.matches ? "auto" : "smooth" });
      });
    });
    aggiorna();
  });

  /* facciata: la mappa o il video reale si caricano solo al clic */
  $$(".facciata").forEach(function (f) {
    var pulsante = $(".facciata__pulsante", f);
    var cornice = $(".facciata__cornice", f);
    var stato = $(".facciata__stato[data-caricamento]", f);
    if (!pulsante) return;
    pulsante.addEventListener("click", function () {
      pulsante.hidden = true;
      if (stato) { stato.hidden = false; stato.textContent = stato.getAttribute("data-caricamento"); }
      if (f.classList.contains("facciata--mappa")) {
        var iframe = document.createElement("iframe");
        iframe.src = f.getAttribute("data-src"); iframe.title = f.getAttribute("data-titolo") || ""; iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade"; iframe.allowFullscreen = true;
        iframe.addEventListener("load", function () { if (stato) stato.hidden = true; });
        setTimeout(function () { if (stato && !stato.hidden) stato.textContent = stato.getAttribute("data-errore"); }, 8000);
        cornice.appendChild(iframe);
      } else {
        var video = document.createElement("video");
        video.controls = true; video.playsInline = true; video.preload = "none"; video.poster = ($("img", cornice) || {}).src || "";
        [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (s) { var src = f.getAttribute("data-" + s[0]); if (src) { var el = document.createElement("source"); el.src = src; el.type = s[1]; video.appendChild(el); } });
        video.addEventListener("playing", function () { if (stato) stato.hidden = true; });
        video.addEventListener("error", function () { if (stato) stato.textContent = stato.getAttribute("data-errore"); }, true);
        cornice.appendChild(video); video.play().catch(function () {});
      }
    });
  });

  /* modulo: validazione all'uscita dal campo e all'invio, riepilogo degli errori, invio simulato, conferma in pagina */
  $$(".modulo").forEach(function (form) {
    var campi = $$("[data-controllo]", form);
    var riepilogo = $(".modulo__riepilogo", form);
    var invio = $("button[type='submit']", form);
    function errore(campo) {
      var id = campo.getAttribute("data-controllo");
      var msg = $("#errore-" + id, form);
      var valore = campo.type === "checkbox" ? campo.checked : (campo.value || "").trim();
      var ok = true;
      if (campo.required && !valore) ok = false;
      if (ok && valore && campo.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valore)) ok = false;
      if (ok && valore && campo.type === "tel" && !/^[\d\s+().-]{6,}$/.test(valore)) ok = false;
      if (ok && valore && campo.type === "number" && !/^\d+$/.test(valore)) ok = false;
      if (ok && valore && campo.type === "date" && new Date(valore) <= new Date()) ok = false;
      if (campo.type === "radio") { ok = $$("input[name='" + campo.name + "']", form).some(function (r) { return r.checked; }); }
      if (msg) msg.hidden = ok;
      if (campo.type !== "radio") campo.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    campi.forEach(function (c) {
      c.addEventListener("blur", function () { errore(c); });
      c.addEventListener("input", function () { if (c.getAttribute("aria-invalid") === "true") errore(c); });
      c.addEventListener("change", function () { errore(c); });
    });
    var file = $("input[type='file']", form);
    var elencoFile = $(".modulo__file", form);
    if (file && elencoFile) {
      file.addEventListener("change", function () {
        elencoFile.innerHTML = "";
        var ammessi = (file.getAttribute("accept") || "").split(",");
        var erroreTipo = $("#errore-allegati-tipo", form);
        var tipoOk = true;
        Array.prototype.forEach.call(file.files, function (f) {
          var est = "." + f.name.split(".").pop().toLowerCase();
          if (ammessi.indexOf(est) < 0) tipoOk = false;
          var li = document.createElement("li");
          li.innerHTML = '<span class="etichetta etichetta--neutra"></span> <span></span> <span></span>';
          li.children[0].textContent = est.slice(1).toUpperCase(); li.children[1].textContent = f.name; li.children[2].textContent = (f.size / 1024).toFixed(0) + " KB";
          elencoFile.appendChild(li);
        });
        if (erroreTipo) erroreTipo.hidden = tipoOk;
        if (!tipoOk) file.value = "";
      });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var sbagliati = campi.filter(function (c) { return !errore(c); });
      var unici = []; sbagliati.forEach(function (c) { if (unici.indexOf(c.name) < 0) unici.push(c.name); });
      if (unici.length) {
        if (riepilogo) {
          var ul = $("ul", riepilogo); ul.innerHTML = "";
          unici.forEach(function (nome) {
            var c = $("[name='" + nome + "']", form);
            var etichetta = $("label[for='" + c.id + "']", form) || $("legend", c.closest("fieldset") || form);
            var li = document.createElement("li"); var a = document.createElement("a"); a.href = "#" + c.id; a.textContent = etichetta ? etichetta.textContent.trim() : nome;
            a.addEventListener("click", function (ev) { ev.preventDefault(); c.focus(); });
            li.appendChild(a); ul.appendChild(li);
          });
          riepilogo.hidden = false; riepilogo.focus();
        }
        return;
      }
      if (riepilogo) riepilogo.hidden = true;
      var testoInvio = invio.textContent;
      invio.textContent = "Invio in corso…"; invio.setAttribute("aria-disabled", "true"); invio.disabled = true;
      setTimeout(function () {
        var conferma = $("#" + form.getAttribute("data-conferma"));
        if (conferma) {
          var n = file ? file.files.length : 0;
          var allegati = $("[data-allegati]", conferma);
          if (allegati) allegati.textContent = n ? "con " + n + (n === 1 ? " allegato" : " allegati") : "senza allegati";
          var bolzano = $("[data-bolzano]", conferma);
          var tipo = $("input[name='tipo_richiesta']:checked", form);
          if (bolzano) bolzano.hidden = !(tipo && tipo.value === "bolzano");
          form.hidden = true; conferma.hidden = false;
          var titolo = $(".modulo__conferma-titolo", conferma); if (titolo) titolo.focus();
        }
        invio.textContent = testoInvio; invio.removeAttribute("aria-disabled"); invio.disabled = false;
      }, 900);
    });
  });

  /* cookie: banner alla prima visita della sessione, pannello dal banner e dal piè di pagina */
  var banner = $(".cookie");
  var pannello = $(".cookie__pannello");
  var chiave = "mockup-cookie";
  function salva(valore) { try { sessionStorage.setItem(chiave, valore); } catch (e) {} if (banner) banner.hidden = true; }
  if (banner) {
    var scelto = null; try { scelto = sessionStorage.getItem(chiave); } catch (e) {}
    if (!scelto) banner.hidden = false;
    $$("[data-cookie]", banner).forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-cookie");
        if (v === "scegli") { if (pannello && pannello.showModal) pannello.showModal(); return; }
        salva(v);
      });
    });
  }
  if (pannello) {
    pannello.addEventListener("close", function () { if (pannello.returnValue && pannello.returnValue !== "chiudi") salva(pannello.returnValue); });
    $$(".cookie__riapri").forEach(function (b) { b.addEventListener("click", function () { if (pannello.showModal) pannello.showModal(); }); });
  }

  /* comparsa dei blocchi dove il browser non ha le animazioni legate allo scorrimento (movimento.css le fa in CSS altrove) */
  if (!(window.CSS && CSS.supports("animation-timeline: view()")) && !movimentoRidotto.matches && "IntersectionObserver" in window) {
    var blocchi = $$(".passi > li, .griglia-schede > li, .griglia-schede__schede > li, .elenco-voci--celle > li, .tabella tbody tr, .galleria__voce, .testo-media__media, .pulsante--gigante, .numeri__foto, .numeri__valore");
    var osservatore = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { v.target.setAttribute("data-visibile", ""); osservatore.unobserve(v.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    blocchi.forEach(function (b) { b.setAttribute("data-comparsa", ""); osservatore.observe(b); });
  }
})();
