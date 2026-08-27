(function () {
  "use strict";

  window.VoxelGame = window.VoxelGame || {};

  var CHUNK_SIZE = 16;
  var CHUNK_HEIGHT = 64;
  var faces = [
    { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 0]], face: "side" },
    { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], face: "side" },
    { dir: [0, 1, 0], corners: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], face: "top" },
    { dir: [0, -1, 0], corners: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]], face: "bottom" },
    { dir: [0, 0, 1], corners: [[0, 0, 1], [0, 1, 1], [1, 1, 1], [1, 0, 1]], face: "side" },
    { dir: [0, 0, -1], corners: [[1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]], face: "side" }
  ];

  function getChunkKey(cx, cy, cz) {
    return cx + "," + cy + "," + cz;
  }

  function getChunkCoords(wx, wy, wz) {
    return {
      cx: Math.floor(wx / CHUNK_SIZE),
      cy: Math.floor(wy / CHUNK_HEIGHT),
      cz: Math.floor(wz / CHUNK_SIZE)
    };
  }

  function getLocalCoords(wx, wy, wz) {
    var lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    var ly = ((wy % CHUNK_HEIGHT) + CHUNK_HEIGHT) % CHUNK_HEIGHT;
    var lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { lx: lx, ly: ly, lz: lz };
  }

  function getVoxel(wx, wy, wz, chunks) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;
    var coords = getChunkCoords(wx, wy, wz);
    var key = getChunkKey(coords.cx, coords.cy, coords.cz);
    var chunk = chunks[key];
    if (!chunk) return 0;
    var local = getLocalCoords(wx, wy, wz);
    return chunk[local.lx + local.lz * CHUNK_SIZE + local.ly * CHUNK_SIZE * CHUNK_SIZE] || 0;
  }

  function createChunkMesh(cellX, cellY, cellZ, material, chunks) {
    var positions = [];
    var normals = [];
    var uvs = [];
    var indices = [];
    var vertexCount = 0;

    var Textures = window.VoxelGame.Textures;
    var BLOCK_TYPES = Textures.BLOCK_TYPES;

    var originX = cellX * CHUNK_SIZE;
    var originY = cellY * CHUNK_HEIGHT;
    var originZ = cellZ * CHUNK_SIZE;

    for (var ly = 0; ly < CHUNK_HEIGHT; ly++) {
      for (var lz = 0; lz < CHUNK_SIZE; lz++) {
        for (var lx = 0; lx < CHUNK_SIZE; lx++) {
          var wx = originX + lx;
          var wy = originY + ly;
          var wz = originZ + lz;

          var voxel = getVoxel(wx, wy, wz, chunks);
          if (voxel === 0) continue;

          for (var f = 0; f < faces.length; f++) {
            var faceInfo = faces[f];
            var nx = wx + faceInfo.dir[0];
            var ny = wy + faceInfo.dir[1];
            var nz = wz + faceInfo.dir[2];

            var neighbor = getVoxel(nx, ny, nz, chunks);
            if (neighbor !== 0) continue;

            var faceType = voxel;
            if (voxel === BLOCK_TYPES.GRASS && faceInfo.face === "bottom") {
              faceType = BLOCK_TYPES.DIRT;
            }

            var uvData = Textures.getUVs(faceType - 1, faceInfo.face);

            for (var c = 0; c < 4; c++) {
              var corner = faceInfo.corners[c];
              positions.push(
                wx + corner[0] - originX,
                wy + corner[1] - originY,
                wz + corner[2] - originZ
              );
              normals.push(faceInfo.dir[0], faceInfo.dir[1], faceInfo.dir[2]);
            }

            uvs.push(uvData.u0, uvData.v0);
            uvs.push(uvData.u0, uvData.v1);
            uvs.push(uvData.u1, uvData.v1);
            uvs.push(uvData.u1, uvData.v0);

            indices.push(
              vertexCount, vertexCount + 1, vertexCount + 2,
              vertexCount, vertexCount + 2, vertexCount + 3
            );
            vertexCount += 4;
          }
        }
      }
    }

    if (positions.length === 0) return null;

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();

    return new THREE.Mesh(geometry, material);
  }

  function updateVoxelMesh(wx, wy, wz, chunks, chunkMeshes, scene, material) {
    var coords = getChunkCoords(wx, wy, wz);
    var chunksToRebuild = [];

    chunksToRebuild.push(getChunkKey(coords.cx, coords.cy, coords.cz));

    for (var d = 0; d < faces.length; d++) {
      var dir = faces[d].dir;
      var nx = wx + dir[0];
      var ny = wy + dir[1];
      var nz = wz + dir[2];
      var nCoords = getChunkCoords(nx, ny, nz);
      var nKey = getChunkKey(nCoords.cx, nCoords.cy, nCoords.cz);
      if (chunksToRebuild.indexOf(nKey) === -1) {
        chunksToRebuild.push(nKey);
      }
    }

    for (var i = 0; i < chunksToRebuild.length; i++) {
      var key = chunksToRebuild[i];
      if (chunkMeshes[key]) {
        scene.remove(chunkMeshes[key]);
        if (chunkMeshes[key].geometry) chunkMeshes[key].geometry.dispose();
        delete chunkMeshes[key];
      }

      var parts = key.split(",");
      var cx = parseInt(parts[0], 10);
      var cy = parseInt(parts[1], 10);
      var cz = parseInt(parts[2], 10);

      var mesh = createChunkMesh(cx, cy, cz, material, chunks);
      if (mesh) {
        scene.add(mesh);
        chunkMeshes[key] = mesh;
      }
    }
  }

  window.VoxelGame.Meshes = {
    CHUNK_SIZE: CHUNK_SIZE,
    CHUNK_HEIGHT: CHUNK_HEIGHT,
    getChunkKey: getChunkKey,
    getChunkCoords: getChunkCoords,
    getLocalCoords: getLocalCoords,
    getVoxel: getVoxel,
    createChunkMesh: createChunkMesh,
    updateVoxelMesh: updateVoxelMesh
  };
})();
