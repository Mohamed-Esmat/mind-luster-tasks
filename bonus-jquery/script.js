$(function () {
  const STORAGE_KEY = "bonus_jquery_items_v1";
  const $input = $("#item-input");
  const $btn = $("#add-btn");
  const $list = $("#list");
  const $error = $("#error");

  function showError(msg) {
    $error.text(msg).fadeIn(200);
    setTimeout(() => $error.fadeOut(500), 2000);
  }

  function readFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveToStorage(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
    } catch (e) {
      // ignore quota errors silently for this simple demo
    }
  }

  function syncStorage() {
    const items = [];
    $list.find("li .text").each(function () {
      const t = $(this).text();
      if (t && t.trim()) items.push(t.trim());
    });
    saveToStorage(items);
  }

  function addItem(text, opts) {
    const options = Object.assign({ save: true, animate: true }, opts);
    const $li = $("<li></li>");
    const $span = $('<span class="text"></span>').text(text);
    const $del = $('<button class="del">Delete</button>');
    $del.on("click", function () {
      $li.fadeOut(300, function () {
        $(this).remove();
        syncStorage();
      });
    });
    $li.append($span, $del);
    if (options.animate) {
      $list.append($li.hide());
      $li.fadeIn(200);
    } else {
      $list.append($li);
    }
    if (options.save) syncStorage();
  }

  $btn.on("click", function () {
    const val = ($input.val() || "").trim();
    if (!val) {
      showError("Please type something first");
      return;
    }
    addItem(val, { save: true, animate: true });
    $input.val("");
    $input.focus();
  });

  $input.on("keypress", function (e) {
    if (e.which === 13) {
      $btn.click();
    }
  });

  // Bootstrap from localStorage
  const initial = readFromStorage();
  if (initial && initial.length) {
    initial.forEach((t) => addItem(t, { save: false, animate: false }));
  }
});
