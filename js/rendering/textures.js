(function () {
  "use strict";

  window.VoxelGame = window.VoxelGame || {};

  var TILE_SIZE = 16;
  var ATLAS_COLS = 8;
  var ATLAS_ROWS = 3;

  var canvas = null;
  var ctx = null;
  var texture = null;

  var BLOCK_TYPES = {
    GRASS: 0,
    DIRT: 1,
    STONE: 2,
    SAND: 3,
    WATER: 4,
    WOOD: 5,
    LEAVES: 6
  };

  function seededRandom(seed) {
    var x = Math.sin(seed) * 43758.5453;
    return x - Math.floor(x);
  }

  function noise(x, y, seed) {
    return seededRandom(x * 12.9898 + y * 78.233 + seed);
  }

  function createBlockTexture(type) {
    var c = document.createElement("canvas");
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    var g = c.getContext("2d");
    var x, y, n;

    switch (type) {
      case BLOCK_TYPES.GRASS:
        for (y = 0; y < TILE_SIZE; y++) {
          for (x = 0; x < TILE_SIZE; x++) {
            n = noise(x, y, 1);
            if (y < 3) {
              var gVal = 80 + Math.floor(n * 40);
              g.fillStyle = "rgb(30," + gVal + ",20)";
              g.fillRect(x, y, 1, 1);
            } else {
              var bVal = 90 + Math.floor(n * 30);
              g.fillStyle = "rgb(" + bVal + "," + Math.floor(bVal * 0.6) + "," + Math.floor(bVal * 0.35) + ")";
              g.fillRect(x, y, 1, 1);
            }
          }
        }
        break;

      case BLOCK_TYPES.DIRT:
        for (y = 0; y < TILE_SIZE; y++) {
          for (x = 0; x < TILE_SIZE; x++) {
            n = noise(x, y, 2);
            var val = 90 + Math.floor(n * 40);
            g.fillStyle = "rgb(" + val + "," + Math.floor(val * 0.6) + "," + Math.floor(val * 0.35) + ")";
            g.fillRect(x, y, 1, 1);
          }
        }
        break;

      case BLOCK_TYPES.STONE:
        for (y = 0; y < TILE_SIZE; y++) {
          for (x = 0; x < TILE_SIZE; x++) {
            n = noise(x, y, 3);
            n += noise(x * 0.5, y * 0.5, 4) * 0.5;
            n = Math.min(1, n);
            var sVal = 100 + Math.floor(n * 55);
            g.fillStyle = "rgb(" + sVal + "," + sVal + "," + (sVal + 5) + ")";
            g.fillRect(x, y, 1, 1);
          }
        }
        break;

      case BLOCK_TYPES.SAND:
        for (y = 0; y < TILE_SIZE; y++) {
          for (x = 0; x < TILE_SIZE; x++) {
            n = noise(x, y, 5);
            var sandR = 210 + Math.floor(n * 30);
            var sandG = 190 + Math.floor(n * 25);
            var sandB = 130 + Math.floor(n * 20);
            g.fillStyle = "rgb(" + sandR + "," + sandG + "," + sandB + ")";
            g.fillRect(x, y, 1, 1);
          }
        }
        break;

      case BLOCK_TYPES.WATER:
        g.fillStyle = "rgba(30,100,200,0.6)";
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        for (y = 0; y < TILE_SIZE; y++) {
          for (x = 0; x < TILE_SIZE; x++) {
            n = noise(x, y, 6);
            var waterB = 180 + Math.floor(n * 40);
            g.fillStyle = "rgba(40,120," + waterB + ",0.3)";
            g.fillRect(x, y, 1, 1);
          }
        }
        break;

      case BLOCK_TYPES.WOOD:
        for (y = 0; y < TILE_SIZE; y++) {
          for (x = 0; x < TILE_SIZE; x++) {
            n = noise(x, y, 7);
            var barkPattern = Math.sin(y * 2.5 + n * 4) * 0.5 + 0.5;
            var barkR = 70 + Math.floor(barkPattern * 30);
            var barkG = 45 + Math.floor(barkPattern * 20);
            var barkB = 20 + Math.floor(barkPattern * 10);
            g.fillStyle = "rgb(" + barkR + "," + barkG + "," + barkB + ")";
            g.fillRect(x, y, 1, 1);
          }
        }
        break;

      case BLOCK_TYPES.LEAVES:
        for (y = 0; y < TILE_SIZE; y++) {
          for (x = 0; x < TILE_SIZE; x++) {
            n = noise(x, y, 8);
            if (n > 0.75) {
              g.fillStyle = "rgba(0,0,0,0)";
              g.clearRect(x, y, 1, 1);
            } else {
              var leafG = 100 + Math.floor(n * 80);
              g.fillStyle = "rgb(20," + leafG + ",15)";
              g.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
    }

    return c;
  }

  function getTopTexture(type) {
    var c = document.createElement("canvas");
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    var g = c.getContext("2d");
    var x, y, n;

    if (type === BLOCK_TYPES.GRASS) {
      for (y = 0; y < TILE_SIZE; y++) {
        for (x = 0; x < TILE_SIZE; x++) {
          n = noise(x, y, 1);
          var gVal = 80 + Math.floor(n * 40);
          g.fillStyle = "rgb(30," + gVal + ",20)";
          g.fillRect(x, y, 1, 1);
        }
      }
    } else if (type === BLOCK_TYPES.WOOD) {
      var cx = TILE_SIZE / 2;
      var cy = TILE_SIZE / 2;
      for (y = 0; y < TILE_SIZE; y++) {
        for (x = 0; x < TILE_SIZE; x++) {
          n = noise(x, y, 9);
          var dx = x - cx;
          var dy = y - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var ring = Math.sin(dist * 2 + n * 3) * 0.5 + 0.5;
          var woodR = 140 + Math.floor(ring * 30);
          var woodG = 100 + Math.floor(ring * 20);
          var woodB = 50 + Math.floor(ring * 15);
          g.fillStyle = "rgb(" + woodR + "," + woodG + "," + woodB + ")";
          g.fillRect(x, y, 1, 1);
        }
      }
    } else if (type === BLOCK_TYPES.LEAVES) {
      for (y = 0; y < TILE_SIZE; y++) {
        for (x = 0; x < TILE_SIZE; x++) {
          n = noise(x, y, 10);
          if (n > 0.8) {
            g.clearRect(x, y, 1, 1);
          } else {
            var leafG = 90 + Math.floor(n * 70);
            g.fillStyle = "rgb(15," + leafG + ",10)";
            g.fillRect(x, y, 1, 1);
          }
        }
      }
    } else {
      return createBlockTexture(type);
    }

    return c;
  }

  function getBottomTexture(type) {
    var c = document.createElement("canvas");
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    var g = c.getContext("2d");
    var x, y, n;

    if (type === BLOCK_TYPES.GRASS) {
      for (y = 0; y < TILE_SIZE; y++) {
        for (x = 0; x < TILE_SIZE; x++) {
          n = noise(x, y, 2);
          var val = 90 + Math.floor(n * 40);
          g.fillStyle = "rgb(" + val + "," + Math.floor(val * 0.6) + "," + Math.floor(val * 0.35) + ")";
          g.fillRect(x, y, 1, 1);
        }
      }
    } else if (type === BLOCK_TYPES.WOOD) {
      return getTopTexture(type);
    } else {
      return createBlockTexture(type);
    }

    return c;
  }

  function createTextureAtlas() {
    var totalW = ATLAS_COLS * TILE_SIZE;
    var totalH = ATLAS_ROWS * TILE_SIZE;

    canvas = document.createElement("canvas");
    canvas.width = totalW;
    canvas.height = totalH;
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, totalW, totalH);

    var blockNames = ["GRASS", "DIRT", "STONE", "SAND", "WATER", "WOOD", "LEAVES"];

    for (var i = 0; i < blockNames.length; i++) {
      var type = BLOCK_TYPES[blockNames[i]];
      var col = i;

      var topTile = getTopTexture(type);
      ctx.drawImage(topTile, col * TILE_SIZE, 0 * TILE_SIZE);

      var sideTile = createBlockTexture(type);
      ctx.drawImage(sideTile, col * TILE_SIZE, 1 * TILE_SIZE);

      var bottomTile = getBottomTexture(type);
      ctx.drawImage(bottomTile, col * TILE_SIZE, 2 * TILE_SIZE);
    }

    return canvas;
  }

  function init() {
    var atlasCanvas = createTextureAtlas();
    texture = new THREE.CanvasTexture(atlasCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  function getUVs(type, face) {
    var col = type;
    var row;
    if (face === "top") row = 0;
    else if (face === "bottom") row = 2;
    else row = 1;

    var u0 = col / ATLAS_COLS;
    var u1 = (col + 1) / ATLAS_COLS;
    var v0 = 1 - (row + 1) / ATLAS_ROWS;
    var v1 = 1 - row / ATLAS_ROWS;

    return { u0: u0, v0: v0, u1: u1, v1: v1 };
  }

  function getTexture() {
    return texture;
  }

  window.VoxelGame.Textures = {
    BLOCK_TYPES: BLOCK_TYPES,
    TILE_SIZE: TILE_SIZE,
    ATLAS_COLS: ATLAS_COLS,
    ATLAS_ROWS: ATLAS_ROWS,
    init: init,
    createBlockTexture: createBlockTexture,
    createTextureAtlas: createTextureAtlas,
    getUVs: getUVs,
    getTexture: getTexture
  };
})();
