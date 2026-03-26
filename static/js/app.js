/**
 * JCA Store — interações: carrinho via fetch, toasts, quantidade +/-,
 * pré-visualização no carrinho, checkout (rótulo fiscal + validação básica).
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return [].slice.call((root || document).querySelectorAll(sel));
  }

  function formatBRL(cents) {
    var v = Math.max(0, Math.round(Number(cents) || 0));
    var reais = Math.floor(v / 100);
    var cc = String(v % 100).padStart(2, "0");
    return "R$ " + reais.toLocaleString("pt-BR") + "," + cc;
  }

  function splitCents(cents) {
    var v = Math.max(0, Math.round(Number(cents) || 0));
    return { whole: Math.floor(v / 100), dec: String(v % 100).padStart(2, "0") };
  }

  function updateCartBadge(count) {
    qsa(".amz-cart-count").forEach(function (el) {
      el.textContent = String(count);
    });
  }

  function showToast(message, kind) {
    var host = qs("#jca-toast-host");
    if (!host) return;
    var t = document.createElement("div");
    t.className = "jca-toast jca-toast--" + (kind || "ok");
    t.textContent = message;
    host.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add("jca-toast--show");
    });
    setTimeout(function () {
      t.classList.remove("jca-toast--show");
      setTimeout(function () {
        t.remove();
      }, 280);
    }, 3200);
  }

  function initFlashes() {
    qsa(".flash").forEach(function (el) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jca-flash-close";
      btn.setAttribute("aria-label", "Fechar aviso");
      btn.innerHTML = "&times;";
      btn.addEventListener("click", function () {
        el.remove();
      });
      el.appendChild(btn);
      setTimeout(function () {
        if (el.parentNode) el.remove();
      }, 8000);
    });
  }

  function initAddToCartAjax() {
    qsa("form.jca-add-cart").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = form.querySelector(".jca-add-cart-btn");
        var url = form.getAttribute("action");
        var qtyInput = form.querySelector('[name="qty"]');
        var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
        var prev = btn ? btn.textContent : "";
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Adicionando…";
        }
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ qty: qty }),
        })
          .then(function (r) {
            return r.json().then(function (data) {
              return { ok: r.ok, data: data };
            });
          })
          .then(function (res) {
            if (res.ok && res.data && res.data.ok) {
              updateCartBadge(res.data.cart_count);
              showToast(res.data.message || "Item adicionado ao carrinho.", "ok");
            } else {
              showToast((res.data && res.data.error) || "Não foi possível adicionar.", "erro");
            }
          })
          .catch(function () {
            form.submit();
          })
          .finally(function () {
            if (btn) {
              btn.disabled = false;
              btn.textContent = prev;
            }
          });
      });
    });
  }

  function bindQtySteppers(root) {
    (root || document).querySelectorAll(".jca-qty-stepper").forEach(function (wrap) {
      if (wrap.dataset.bound) return;
      wrap.dataset.bound = "1";
      var input = wrap.querySelector(".jca-qty-input");
      if (!input) return;
      var min = input.hasAttribute("min") ? parseInt(input.getAttribute("min"), 10) : 0;
      wrap.querySelectorAll(".jca-qty-step").forEach(function (b) {
        b.addEventListener("click", function () {
          var dir = parseInt(b.getAttribute("data-step"), 10) || 0;
          var v = parseInt(input.value, 10);
          if (isNaN(v)) v = min;
          v += dir;
          if (v < min) v = min;
          if (input.name === "qty" && min >= 1 && v < 1) v = 1;
          input.value = String(v);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
    });
  }

  function initCartLive() {
    var form = qs("#jca-cart-form");
    if (!form) return;

    var hint = qs(".jca-cart-live-hint");
    if (hint) hint.hidden = false;

    var freeMin = parseInt(document.body.getAttribute("data-shipping-free-min-cents") || "20000", 10);
    var flatShip = parseInt(document.body.getAttribute("data-shipping-flat-cents") || "1590", 10);

    function recompute() {
      var rows = qsa(".jca-cart-row", form);
      var subtotal = 0;
      rows.forEach(function (row) {
        var unit = parseInt(row.getAttribute("data-unit-cents"), 10) || 0;
        var inp = qs('[data-role="cart-qty"]', row);
        var q = inp ? parseInt(inp.value, 10) || 0 : 0;
        var line = unit * q;
        subtotal += line;
        var cell = qs('[data-role="line-total"]', row);
        if (cell) cell.textContent = formatBRL(line);
      });

      var sp = splitCents(subtotal);
      var wEl = qs("#jca-live-subtotal-whole");
      var dEl = qs("#jca-live-subtotal-dec");
      if (wEl) wEl.textContent = sp.whole.toLocaleString("pt-BR");
      if (dEl) dEl.textContent = "," + sp.dec;

      var shipping = subtotal >= freeMin || subtotal === 0 ? 0 : flatShip;
      var shipEl = qs("#jca-live-shipping");
      if (shipEl) {
        if (subtotal === 0) shipEl.textContent = "—";
        else if (shipping === 0) shipEl.textContent = "GRÁTIS";
        else shipEl.textContent = formatBRL(shipping);
      }

      var total = subtotal + shipping;
      var totEl = qs("#jca-live-total");
      if (totEl) totEl.textContent = formatBRL(total);

      var msg = qs("#jca-live-free-msg");
      var gap = qs("#jca-live-free-gap");
      if (msg && gap) {
        if (subtotal >= freeMin || subtotal === 0) {
          msg.hidden = true;
        } else {
          msg.hidden = false;
          gap.textContent = formatBRL(freeMin - subtotal);
        }
      }
    }

    bindQtySteppers(form);
    qsa(".jca-cart-row [data-role='cart-qty']", form).forEach(function (inp) {
      inp.addEventListener("input", recompute);
    });
    recompute();
  }

  function digitsOnly(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function initCheckout() {
    var form = qs("#jca-checkout-form");
    if (!form) return;

    var sel = qs("#customer_type", form);
    var span = qs("#fiscal-label-text", form);
    var fiscalMap = {
      pf: "NFC-e (cupom fiscal eletrônico)",
      pj: "NF-e (nota fiscal eletrônica)",
    };

    function updFiscal() {
      if (span && sel) span.textContent = fiscalMap[sel.value] || "";
    }
    if (sel) {
      sel.addEventListener("change", updFiscal);
      updFiscal();
    }

    form.addEventListener("submit", function (e) {
      var err = qs("#jca-checkout-error", form);
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }

      var tipo = sel ? sel.value : "pf";
      var docEl = qs("#document", form);
      var doc = docEl ? digitsOnly(docEl.value) : "";
      var name = (qs("#name", form) && qs("#name", form).value) || "";
      name = name.trim();
      var email = (qs("#email", form) && qs("#email", form).value) || "";
      email = email.trim();

      if (tipo === "pf") {
        if (doc.length !== 11) {
          e.preventDefault();
          if (err) {
            err.textContent = "CPF deve ter 11 dígitos (verifique o número).";
            err.hidden = false;
          }
          return;
        }
      } else if (doc.length !== 14) {
        e.preventDefault();
        if (err) {
          err.textContent = "CNPJ deve ter 14 dígitos (verifique o número).";
          err.hidden = false;
        }
        return;
      }

      if (!name || !email) {
        e.preventDefault();
        if (err) {
          err.textContent = "Preencha nome (ou razão social) e e-mail.";
          err.hidden = false;
        }
        return;
      }

      var btn = qs(".jca-checkout-submit", form);
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Processando…";
      }
    });
  }

  function syncCartCountOnLoad() {
    var url = document.body.getAttribute("data-api-cart-count");
    if (!url) return;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data && typeof data.cart_count === "number") updateCartBadge(data.cart_count);
      })
      .catch(function () {});
  }

  function initSearchHotkey() {
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable))
        return;
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var s = qs("#amz-search-q") || qs("#jca-filter-q");
        if (s) {
          e.preventDefault();
          s.focus();
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFlashes();
    initAddToCartAjax();
    bindQtySteppers(document);
    initCartLive();
    initCheckout();
    syncCartCountOnLoad();
    initSearchHotkey();
  });
})();
