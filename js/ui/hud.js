(function () {
  "use strict";

  window.VoxelGame = window.VoxelGame || {};

  var container = null;
  var healthBar = null;
  var healthFill = null;
  var hungerBar = null;
  var hungerFill = null;
  var hotbar = null;
  var hotbarSlots = [];
  var debugOverlay = null;
  var fpsDisplay = null;
  var posDisplay = null;
  var biomeDisplay = null;
  var healthValue = 20;
  var hungerValue = 20;

  function createElement(tag, className, parent) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (parent) parent.appendChild(el);
    return el;
  }

  function createStyle(id, css) {
    var style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }

  function init() {
    container = document.getElementById("hud");
    if (!container) {
      container = createElement("div", "hud-container", document.body);
      container.id = "hud";
    }

    createStyle("hud-styles",
      ".hud-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;font-family:'Courier New',monospace;}" +
      ".health-container{position:absolute;bottom:50px;left:50%;transform:translateX(-50%);display:flex;gap:2px;}" +
      ".health-heart{width:12px;height:12px;background:#e74c3c;border:1px solid #c0392b;transition:opacity 0.3s;}" +
      ".health-heart.empty{background:#444;border-color:#333;opacity:0.5;}" +
      ".hunger-container{position:absolute;bottom:50px;left:calc(50% + 100px);display:flex;gap:2px;}" +
      ".hunger-shank{width:12px;height:12px;background:#e67e22;border:1px solid #d35400;transition:opacity 0.3s;}" +
      ".hunger-shank.empty{background:#444;border-color:#333;opacity:0.5;}" +
      ".hotbar{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:2px;pointer-events:auto;}" +
      ".hotbar-slot{width:50px;height:50px;background:rgba(0,0,0,0.6);border:2px solid #555;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:border-color 0.2s;}" +
      ".hotbar-slot.selected{border-color:#fff;border-width:3px;}" +
      ".hotbar-slot-icon{width:32px;height:32px;image-rendering:pixelated;}" +
      ".hotbar-slot-key{position:absolute;top:2px;left:4px;color:#aaa;font-size:10px;}" +
      ".hotbar-slot-count{position:absolute;bottom:2px;right:4px;color:#fff;font-size:10px;text-shadow:1px 1px #000;}" +
      ".debug-overlay{position:absolute;top:10px;left:10px;color:#fff;font-size:12px;text-shadow:1px 1px #000;line-height:1.6;background:rgba(0,0,0,0.3);padding:8px 12px;border-radius:4px;}"
    );

    createHealthBar();
    createHungerBar();
    createHotbar();
    createDebugOverlay();
  }

  function createHealthBar() {
    healthBar = createElement("div", "health-container", container);
    healthBar.innerHTML = "";
    for (var i = 0; i < 10; i++) {
      var heart = createElement("div", "health-heart", healthBar);
      heart.dataset.index = i;
    }
  }

  function createHungerBar() {
    hungerBar = createElement("div", "hunger-container", container);
    hungerBar.innerHTML = "";
    for (var i = 0; i < 10; i++) {
      var shank = createElement("div", "hunger-shank", hungerBar);
      shank.dataset.index = i;
    }
  }

  function createHotbar() {
    hotbar = createElement("div", "hotbar", container);
    hotbar.innerHTML = "";
    hotbarSlots = [];
    var blockNames = ["GRASS", "DIRT", "STONE", "SAND", "WATER", "WOOD", "LEAVES"];

    for (var i = 0; i < 9; i++) {
      var slot = createElement("div", "hotbar-slot", hotbar);
      slot.dataset.index = i;

      var keyLabel = createElement("span", "hotbar-slot-key", slot);
      keyLabel.textContent = (i + 1).toString();

      var icon = createElement("canvas", "hotbar-slot-icon", slot);
      icon.width = 32;
      icon.height = 32;

      var countLabel = createElement("span", "hotbar-slot-count", slot);
      countLabel.textContent = "";

      var ctx2d = icon.getContext("2d");
      if (i < blockNames.length) {
        var miniCanvas = window.VoxelGame.Textures.createBlockTexture(
          window.VoxelGame.Textures.BLOCK_TYPES[blockNames[i]]
        );
        ctx2d.imageSmoothingEnabled = false;
        ctx2d.drawImage(miniCanvas, 0, 0, 32, 32);
      }

      slot.addEventListener("click", (function (index) {
        return function () {
          updateHotbar(index);
        };
      })(i));

      hotbarSlots.push({
        element: slot,
        icon: icon,
        count: countLabel,
        index: i
      });
    }
  }

  function createDebugOverlay() {
    debugOverlay = createElement("div", "debug-overlay", container);
    debugOverlay.style.display = "none";

    fpsDisplay = createElement("div", null, debugOverlay);
    posDisplay = createElement("div", null, debugOverlay);
    biomeDisplay = createElement("div", null, debugOverlay);

    fpsDisplay.textContent = "FPS: 0";
    posDisplay.textContent = "XYZ: 0.0 / 0.0 / 0.0";
    biomeDisplay.textContent = "Biome: Plains";
  }

  function updateHealth(hp) {
    healthValue = Math.max(0, Math.min(20, hp));
    var halfHearts = Math.floor(healthValue / 2);
    var fullHearts = Math.floor(halfHearts);
    var halfHeart = halfHearts % 2 === 1;

    var hearts = healthBar.querySelectorAll(".health-heart");
    for (var i = 0; i < hearts.length; i++) {
      var heartIdx = hearts.length - 1 - i;
      if (heartIdx < fullHearts) {
        hearts[i].classList.remove("empty");
      } else if (heartIdx === fullHearts && halfHeart) {
        hearts[i].classList.remove("empty");
        hearts[i].style.opacity = "0.7";
      } else {
        hearts[i].classList.add("empty");
        hearts[i].style.opacity = "";
      }
    }
  }

  function updateHunger(hp) {
    hungerValue = Math.max(0, Math.min(20, hp));
    var halfShanks = Math.floor(hungerValue / 2);
    var fullShanks = Math.floor(halfShanks);
    var halfShank = halfShanks % 2 === 1;

    var shanks = hungerBar.querySelectorAll(".hunger-shank");
    for (var i = 0; i < shanks.length; i++) {
      var idx = shanks.length - 1 - i;
      if (idx < fullShanks) {
        shanks[i].classList.remove("empty");
      } else if (idx === fullShanks && halfShank) {
        shanks[i].classList.remove("empty");
        shanks[i].style.opacity = "0.7";
      } else {
        shanks[i].classList.add("empty");
        shanks[i].style.opacity = "";
      }
    }
  }

  function updateHotbar(selectedIdx, blockTypes) {
    for (var i = 0; i < hotbarSlots.length; i++) {
      if (i === selectedIdx) {
        hotbarSlots[i].element.classList.add("selected");
      } else {
        hotbarSlots[i].element.classList.remove("selected");
      }
    }

    if (blockTypes) {
      for (var j = 0; j < hotbarSlots.length && j < blockTypes.length; j++) {
        var blockName = blockTypes[j];
        var canvas = hotbarSlots[j].icon;
        var g = canvas.getContext("2d");
        g.clearRect(0, 0, 32, 32);

        if (blockName && window.VoxelGame.Textures.BLOCK_TYPES[blockName] !== undefined) {
          var miniCanvas = window.VoxelGame.Textures.createBlockTexture(
            window.VoxelGame.Textures.BLOCK_TYPES[blockName]
          );
          g.imageSmoothingEnabled = false;
          g.drawImage(miniCanvas, 0, 0, 32, 32);
        }
      }
    }
  }

  function updateDebugInfo(fps, pos, biome) {
    debugOverlay.style.display = "block";

    if (fps !== undefined) {
      fpsDisplay.textContent = "FPS: " + Math.round(fps);
    }

    if (pos) {
      posDisplay.textContent = "XYZ: " +
        pos.x.toFixed(1) + " / " +
        pos.y.toFixed(1) + " / " +
        pos.z.toFixed(1);
    }

    if (biome !== undefined) {
      biomeDisplay.textContent = "Biome: " + biome;
    }
  }

  function toggleDebug() {
    if (debugOverlay.style.display === "none") {
      debugOverlay.style.display = "block";
    } else {
      debugOverlay.style.display = "none";
    }
  }

  function show() {
    container.style.display = "block";
  }

  function hide() {
    container.style.display = "none";
  }

  window.VoxelGame.HUD = {
    init: init,
    updateHealth: updateHealth,
    updateHunger: updateHunger,
    updateHotbar: updateHotbar,
    updateDebugInfo: updateDebugInfo,
    toggleDebug: toggleDebug,
    show: show,
    hide: hide
  };
})();
