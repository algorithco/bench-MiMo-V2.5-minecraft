(function () {
  window.VoxelGame = window.VoxelGame || {};

  var CHUNK_SIZE = 16;
  var WORLD_HEIGHT = 64;
  var BLOCK;

  var noise;
  var caveNoise;
  var treeNoise;

  VoxelGame.Terrain = {
    init: function (seed) {
      BLOCK = VoxelGame.BLOCK;
      noise = new VoxelGame.SimplexNoise(seed || 12345);
      caveNoise = new VoxelGame.SimplexNoise((seed || 12345) + 1);
      treeNoise = new VoxelGame.SimplexNoise((seed || 12345) + 2);
      VoxelGame.worldCells = {};
    },

    getTerrainHeight: function (wx, wz) {
      var scale1 = 0.01;
      var scale2 = 0.03;
      var scale3 = 0.005;

      var h = 0;
      h += noise.noise3D(wx * scale1, 0, wz * scale1) * 20;
      h += noise.noise3D(wx * scale2, 0, wz * scale2) * 8;
      h += noise.noise3D(wx * scale3, 0, wz * scale3) * 30;

      var baseHeight = 20;
      var height = Math.floor(baseHeight + h);
      if (height < 1) height = 1;
      if (height >= WORLD_HEIGHT) height = WORLD_HEIGHT - 1;
      return height;
    },

    hasCave: function (x, y, z) {
      var scale = 0.05;
      var val = caveNoise.noise3D(x * scale, y * scale, z * scale);
      return val > 0.45;
    },

    generateTree: function (x, z) {
      var treeBlocks = [];
      var height = this.getTerrainHeight(x, z);
      var trunkHeight = 4 + Math.floor(Math.abs(treeNoise.noise3D(x * 0.5, 0, z * 0.5)) * 3);

      for (var ty = 1; ty <= trunkHeight; ty++) {
        treeBlocks.push({ x: x, y: height + ty, z: z, type: BLOCK.WOOD });
      }

      var leafBase = height + trunkHeight - 1;
      var leafTop = height + trunkHeight + 2;
      for (var ly = leafBase; ly <= leafTop; ly++) {
        var radius = ly === leafTop ? 1 : (ly === leafBase ? 2 : 2);
        for (var lx = -radius; lx <= radius; lx++) {
          for (var lz = -radius; lz <= radius; lz++) {
            if (lx === 0 && lz === 0 && ly < leafTop) continue;
            if (Math.abs(lx) === radius && Math.abs(lz) === radius && Math.random() > 0.6) continue;
            treeBlocks.push({ x: x + lx, y: ly, z: z + lz, type: BLOCK.LEAVES });
          }
        }
      }

      return treeBlocks;
    },

    generateChunk: function (cx, cy, cz) {
      var key = cx + ',' + cy + ',' + cz;
      if (VoxelGame.worldCells[key]) return VoxelGame.worldCells[key];

      var cells = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
      var wx0 = cx * CHUNK_SIZE;
      var wy0 = cy * CHUNK_SIZE;
      var wz0 = cz * CHUNK_SIZE;

      var treePositions = [];

      for (var lx = 0; lx < CHUNK_SIZE; lx++) {
        for (var lz = 0; lz < CHUNK_SIZE; lz++) {
          var wx = wx0 + lx;
          var wz = wz0 + lz;
          var terrainY = this.getTerrainHeight(wx, wz);

          for (var ly = 0; ly < CHUNK_SIZE; ly++) {
            var wy = wy0 + ly;
            var idx = lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE;

            if (wy > terrainY) {
              if (wy <= 18) {
                cells[idx] = BLOCK.WATER;
              } else {
                cells[idx] = BLOCK.AIR;
              }
            } else if (wy === terrainY) {
              if (wy <= 19) {
                cells[idx] = BLOCK.SAND;
              } else {
                cells[idx] = BLOCK.GRASS;
              }
            } else if (wy > terrainY - 4) {
              if (wy <= 19) {
                cells[idx] = BLOCK.SAND;
              } else {
                cells[idx] = BLOCK.DIRT;
              }
            } else {
              cells[idx] = BLOCK.STONE;
            }

            if (cells[idx] !== BLOCK.AIR && cells[idx] !== BLOCK.WATER && wy > 20 && wy <= terrainY - 1) {
              if (this.hasCave(wx, wy, wz)) {
                cells[idx] = BLOCK.AIR;
              }
            }

            if (cells[idx] === BLOCK.GRASS && ly > 3 && Math.random() < 0.005) {
              treePositions.push({ x: wx, z: wz });
            }
          }
        }
      }

      var self = this;
      treePositions.forEach(function (pos) {
        var treeBlocks = self.generateTree(pos.x, pos.z);
        treeBlocks.forEach(function (b) {
          var tlx = b.x - wx0;
          var tly = b.y - wy0;
          var tlz = b.z - wz0;
          if (tlx >= 0 && tlx < CHUNK_SIZE && tly >= 0 && tly < CHUNK_SIZE && tlz >= 0 && tlz < CHUNK_SIZE) {
            var idx = tlx + tly * CHUNK_SIZE + tlz * CHUNK_SIZE * CHUNK_SIZE;
            cells[idx] = b.type;
          }
        });
      });

      VoxelGame.worldCells[key] = cells;
      return cells;
    }
  };
})();
