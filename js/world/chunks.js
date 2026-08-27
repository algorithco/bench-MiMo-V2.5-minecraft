(function () {
  window.VoxelGame = window.VoxelGame || {};

  var CHUNK_SIZE = 16;
  var WORLD_HEIGHT = 64;

  var faces = [
    { dir: [1, 0, 0], corners: [[1,0,1],[1,0,0],[1,1,1],[1,1,0]], normal: [1,0,0] },
    { dir: [-1, 0, 0], corners: [[0,0,0],[0,0,1],[0,1,0],[0,1,1]], normal: [-1,0,0] },
    { dir: [0, 1, 0], corners: [[0,1,0],[0,1,1],[1,1,0],[1,1,1]], normal: [0,1,0] },
    { dir: [0, -1, 0], corners: [[0,0,1],[0,0,0],[1,0,1],[1,0,0]], normal: [0,-1,0] },
    { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[0,1,1],[1,1,1]], normal: [0,0,1] },
    { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[1,1,0],[0,1,0]], normal: [0,0,-1] }
  ];

  var uvCoords = [
    [0, 0], [1, 0], [0, 1], [1, 1]
  ];

  function getBlockUV(blockType, faceIdx) {
    var BLOCK = VoxelGame.BLOCK;
    var u, v;

    if (blockType === BLOCK.GRASS) {
      if (faceIdx === 2) { u = 0; v = 0; }
      else if (faceIdx === 3) { u = 2; v = 0; }
      else { u = 0; v = 0; }
    } else if (blockType === BLOCK.DIRT) {
      u = 2; v = 0;
    } else if (blockType === BLOCK.STONE) {
      u = 1; v = 0;
    } else if (blockType === BLOCK.SAND) {
      u = 3; v = 0;
    } else if (blockType === BLOCK.WATER) {
      u = 4; v = 0;
    } else if (blockType === BLOCK.WOOD) {
      if (faceIdx === 2 || faceIdx === 3) { u = 5; v = 0; }
      else { u = 6; v = 0; }
    } else if (blockType === BLOCK.LEAVES) {
      u = 7; v = 0;
    } else {
      u = 0; v = 0;
    }

    var tileSize = 1.0 / 8.0;
    return [
      [u * tileSize, (v + 1) * tileSize],
      [(u + 1) * tileSize, (v + 1) * tileSize],
      [u * tileSize, v * tileSize],
      [(u + 1) * tileSize, v * tileSize]
    ];
  }

  function idx(x, y, z) {
    return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
  }

  function getVoxelFromCells(cells, x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
      return VoxelGame.BLOCK.AIR;
    }
    return cells[idx(x, y, z)];
  }

  VoxelGame.Chunks = {
    cells: {},

    getVoxel: function (x, y, z) {
      var BLOCK = VoxelGame.BLOCK;
      var cx = Math.floor(x / CHUNK_SIZE);
      var cy = Math.floor(y / CHUNK_SIZE);
      var cz = Math.floor(z / CHUNK_SIZE);
      var key = cx + ',' + cy + ',' + cz;

      var cells = this.cells[key] || VoxelGame.worldCells[key];
      if (!cells) return BLOCK.AIR;

      var lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      var ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      var lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

      return cells[idx(lx, ly, lz)];
    },

    setVoxel: function (x, y, z, type) {
      var cx = Math.floor(x / CHUNK_SIZE);
      var cy = Math.floor(y / CHUNK_SIZE);
      var cz = Math.floor(z / CHUNK_SIZE);
      var key = cx + ',' + cy + ',' + cz;

      if (!this.cells[key]) {
        this.cells[key] = VoxelGame.worldCells[key] || new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
      }

      var lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      var ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      var lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

      this.cells[key][idx(lx, ly, lz)] = type;
    },

    generateCellGeometry: function (cellX, cellY, cellZ) {
      var BLOCK = VoxelGame.BLOCK;
      var positions = [];
      var normals = [];
      var uvs = [];
      var indices = [];
      var vertCount = 0;

      var key = cellX + ',' + cellY + ',' + cellZ;
      var cells = this.cells[key] || VoxelGame.worldCells[key];
      if (!cells) return { positions: positions, normals: normals, uvs: uvs, indices: indices };

      for (var y = 0; y < CHUNK_SIZE; y++) {
        for (var z = 0; z < CHUNK_SIZE; z++) {
          for (var x = 0; x < CHUNK_SIZE; x++) {
            var blockType = cells[idx(x, y, z)];
            if (blockType === BLOCK.AIR) continue;

            for (var f = 0; f < faces.length; f++) {
              var face = faces[f];
              var nx = x + face.dir[0];
              var ny = y + face.dir[1];
              var nz = z + face.dir[2];

              var neighbor = getVoxelFromCells(cells, nx, ny, nz);

              if (neighbor === BLOCK.AIR || (blockType !== BLOCK.WATER && neighbor === BLOCK.WATER)) {
                var faceUVs = getBlockUV(blockType, f);

                for (var c = 0; c < 4; c++) {
                  var corner = face.corners[c];
                  positions.push(
                    x + corner[0],
                    y + corner[1],
                    z + corner[2]
                  );
                  normals.push(face.normal[0], face.normal[1], face.normal[2]);
                  uvs.push(faceUVs[c][0], faceUVs[c][1]);
                }

                indices.push(
                  vertCount, vertCount + 1, vertCount + 2,
                  vertCount + 2, vertCount + 1, vertCount + 3
                );
                vertCount += 4;
              }
            }
          }
        }
      }

      return { positions: positions, normals: normals, uvs: uvs, indices: indices };
    }
  };
})();
