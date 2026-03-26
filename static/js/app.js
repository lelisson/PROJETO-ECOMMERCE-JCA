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
    var n = Math.max(0, Math.floor(Number(count) || 0));
    qsa(".amz-cart-count").forEach(function (el) {
      el.textContent = String(n);
    });
    var badge = qs(".jca-subnav-cart-badge");
    var subLink = qs("[data-subnav-cart-link]");
    if (badge) {
      badge.textContent = n > 0 ? String(n) : "";
      if (n > 0) {
        badge.setAttribute("aria-label", n + " itens no carrinho");
        badge.removeAttribute("aria-hidden");
      } else {
        badge.removeAttribute("aria-label");
        badge.setAttribute("aria-hidden", "true");
      }
    }
    if (subLink) {
      if (n > 0) subLink.classList.add("jca-subnav-cart--active");
      else subLink.classList.remove("jca-subnav-cart--active");
    }
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

  function initCheckoutWizard() {
    var form = qs("#jca-checkout-form");
    if (!form || !form.getAttribute("data-api-frete")) return;

    var sel = qs("#customer_type", form);
    var span = qs("#fiscal-label-text", form);
    var docLabel = qs("#jca-doc-label", form);
    var fiscalMap = {
      pf: "NFC-e (cupom fiscal eletrônico)",
      pj: "NF-e (nota fiscal eletrônica)",
    };

    function updFiscal() {
      if (span && sel) span.textContent = fiscalMap[sel.value] || "";
      if (docLabel && sel) docLabel.textContent = sel.value === "pj" ? "CNPJ" : "CPF";
    }
    if (sel) {
      sel.addEventListener("change", updFiscal);
      updFiscal();
    }

    var steps = qsa(".jca-step", form);
    var indicator = qs("#jca-step-indicator");
    var btnPrev = qs("#jca-wizard-prev", form);
    var btnNext = qs("#jca-wizard-next", form);
    var btnSubmit = qs("#jca-checkout-submit", form);
    var deliveryInput = qs("#delivery_mode", form);
    var freightPanel = qs("#jca-freight-panel", form);
    var btnRet = qs("#jca-btn-retirada", form);
    var btnFrete = qs("#jca-btn-calc-frete", form);
    var btnFreteRun = qs("#jca-freight-run", form);
    var freightStatus = qs("#jca-freight-status", form);
    var freightResult = qs("#jca-freight-result", form);
    var apiFrete = form.getAttribute("data-api-frete");
    var subtotalCents = parseInt(form.getAttribute("data-subtotal-cents") || "0", 10) || 0;

    var currentStep = 1;
    var freightReady = false;
    var freightCents = 0;
    var lastDelivery = (deliveryInput && deliveryInput.value) || "retirada";

    function showStep(n) {
      currentStep = n;
      steps.forEach(function (el) {
        var sn = parseInt(el.getAttribute("data-checkout-step"), 10);
        var on = sn === n;
        el.hidden = !on;
        el.classList.toggle("jca-step--hidden", !on);
      });
      if (indicator) {
        var titles = ["", "Seus dados", "Retirada ou frete", "Pagamento (simulado)"];
        indicator.textContent = "Passo " + n + " de 3 — " + titles[n];
      }
      if (btnPrev) btnPrev.hidden = n <= 1;
      if (btnNext) btnNext.hidden = n >= 3;
      if (btnSubmit) btnSubmit.hidden = n < 3;
    }

    function updateResumo() {
      var f = freightCents;
      if (lastDelivery === "retirada") f = 0;
      var elF = qs("#jca-resumo-frete");
      var elT = qs("#jca-resumo-total");
      if (elF) elF.textContent = formatBRL(f);
      if (elT) elT.textContent = formatBRL(subtotalCents + f);
    }

    function validateStep1() {
      var tipo = sel ? sel.value : "pf";
      var doc = digitsOnly(qs("#document", form).value);
      var name = (qs("#name", form).value || "").trim();
      var phone = (qs("#phone", form).value || "").trim();
      var cep = digitsOnly(qs("#cep", form).value);
      var email = (qs("#email", form).value || "").trim();
      if (tipo === "pf" && doc.length !== 11) return "CPF deve ter 11 dígitos.";
      if (tipo === "pj" && doc.length !== 14) return "CNPJ deve ter 14 dígitos.";
      if (!name) return "Informe o nome ou razão social.";
      if (!phone) return "Informe o telefone.";
      if (cep.length !== 8) return "Informe um CEP com 8 dígitos.";
      if (!email) return "Informe o e-mail.";
      return "";
    }

    function validateStep2() {
      if (lastDelivery === "entrega" && !freightReady) {
        return "Calcule o frete antes de continuar ou escolha retirada na loja.";
      }
      return "";
    }

    function validateFinal() {
      var a = validateStep1();
      if (a) return a;
      var b = validateStep2();
      if (b) return b;
      return "";
    }

    if (btnRet) {
      btnRet.addEventListener("click", function () {
        lastDelivery = "retirada";
        if (deliveryInput) deliveryInput.value = "retirada";
        freightReady = true;
        freightCents = 0;
        if (freightPanel) freightPanel.hidden = true;
        if (freightStatus) freightStatus.textContent = "";
        if (freightResult) {
          freightResult.hidden = true;
          freightResult.innerHTML = "";
        }
        btnRet.classList.add("jca-btn-choice--primary");
        if (btnFrete) btnFrete.classList.remove("jca-btn-choice--primary");
        updateResumo();
      });
    }

    if (btnFrete) {
      btnFrete.addEventListener("click", function () {
        lastDelivery = "entrega";
        if (deliveryInput) deliveryInput.value = "entrega";
        freightReady = false;
        freightCents = 0;
        if (freightPanel) freightPanel.hidden = false;
        if (freightStatus) freightStatus.textContent = "";
        if (freightResult) {
          freightResult.hidden = true;
          freightResult.innerHTML = "";
        }
        btnFrete.classList.add("jca-btn-choice--primary");
        if (btnRet) btnRet.classList.remove("jca-btn-choice--primary");
        updateResumo();
      });
    }

    if (btnFreteRun) {
      btnFreteRun.addEventListener("click", function () {
        var cep = digitsOnly(qs("#cep", form).value);
        freightReady = false;
        if (freightStatus) freightStatus.textContent = "Calculando…";
        if (freightResult) freightResult.hidden = true;
        fetch(apiFrete, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ cep: cep }),
        })
          .then(function (r) {
            return r.json().then(function (data) {
              return { ok: r.ok, data: data };
            });
          })
          .then(function (res) {
            if (res.ok && res.data && res.data.ok) {
              freightCents = res.data.freight_cents || 0;
              freightReady = true;
              if (freightStatus) freightStatus.textContent = "";
              if (freightResult) {
                freightResult.hidden = false;
                freightResult.innerHTML =
                  "<p><strong>Distância estimada:</strong> " +
                  res.data.distance_km +
                  " km (" +
                  (res.data.mode === "osrm" ? "rota" : "estimativa") +
                  ")</p><p><strong>Frete:</strong> " +
                  formatBRL(freightCents) +
                  "</p><p class='jca-frete-addr'>" +
                  (res.data.address_label || "") +
                  "</p>";
              }
              updateResumo();
            } else {
              if (freightStatus)
                freightStatus.textContent = (res.data && res.data.error) || "Não foi possível calcular.";
            }
          })
          .catch(function () {
            if (freightStatus) freightStatus.textContent = "Erro de rede ao calcular frete.";
          });
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        var errBox = qs("#jca-checkout-error", form);
        if (errBox) {
          errBox.hidden = true;
          errBox.textContent = "";
        }
        if (currentStep === 1) {
          var e1 = validateStep1();
          if (e1) {
            if (errBox) {
              errBox.textContent = e1;
              errBox.hidden = false;
            }
            return;
          }
          showStep(2);
          if (lastDelivery === "retirada" && btnRet) btnRet.click();
          else if (lastDelivery === "entrega" && btnFrete) btnFrete.click();
          return;
        }
        if (currentStep === 2) {
          var e2 = validateStep2();
          if (e2) {
            if (errBox) {
              errBox.textContent = e2;
              errBox.hidden = false;
            }
            return;
          }
          showStep(3);
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        if (currentStep > 1) showStep(currentStep - 1);
      });
    }

    form.addEventListener("submit", function (e) {
      var err = qs("#jca-checkout-error", form);
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      var msg = validateFinal();
      if (msg) {
        e.preventDefault();
        var e1 = validateStep1();
        if (e1) showStep(1);
        else showStep(2);
        if (err) {
          err.textContent = msg;
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

    if (lastDelivery === "entrega" && btnFrete) {
      btnFrete.classList.add("jca-btn-choice--primary");
      if (btnRet) btnRet.classList.remove("jca-btn-choice--primary");
      if (freightPanel) freightPanel.hidden = false;
    } else {
      if (btnRet) btnRet.classList.add("jca-btn-choice--primary");
    }

    showStep(1);
    updateResumo();
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
    initCheckoutWizard();
    syncCartCountOnLoad();
    initSearchHotkey();
  });
})();
