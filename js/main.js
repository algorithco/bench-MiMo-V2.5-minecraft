(function () {
  "use strict";

  var G = window.VoxelGame;
  var scene, camera, renderer, material;
  var playerPos, playerVel, onGround, yaw, pitch;
  var chat, clock;
  var cellMeshes = {};
  var pointerLocked = false;
  var isDead = false;
  var lastChunkX = -999, lastChunkZ = -999;
  var lastTime = performance.now();
  var frameCount = 0, fpsTime = 0;
  var stepTimer = 0;
  var selectedSlot = 0;
  var blockTypes = ['GRASS', 'DIRT', 'STONE', 'WOOD', 'LEAVES'];

  var NEIGHBOR_OFFSETS = [[0,0,0],[-1,0,0],[1,0,0],[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]];

  function init() {
    G.Terrain.init(12345);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 50, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    var ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambLight);
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    var texture = G.Textures.init();
    material = new THREE.MeshLambertMaterial({
      map: texture,
      side: THREE.FrontSide,
      alphaTest: 0.1
    });

    G.Input.init(renderer.domElement);
    G.Particles.init(scene);
    G.Sky.init(scene, renderer, dirLight, ambLight);
    G.Sounds.init();
    G.HUD.init();
    chat = new G.Chat.ChatSystem();

    playerPos = new THREE.Vector3(8, 50, 8);
    playerVel = new THREE.Vector3();
    onGround = false;
    yaw = 0;
    pitch = 0;
    clock = new THREE.Clock();

    ensureChunksAround(Math.floor(playerPos.x / 16), Math.floor(playerPos.z / 16));

    var startY = G.Terrain.getTerrainHeight(8, 8) + 2;
    playerPos.y = startY;

    generateTrees();
    buildAllMeshes();

    G.HUD.updateHotbar(0);
    G.HUD.updateHealth(20);

    setupPointerLock();
    setupBlockInteraction();
    setupScrollWheel();

    animate();
  }

  function ensureChunksAround(pcx, pcz) {
    for (var dx = -G.RENDER_DISTANCE; dx <= G.RENDER_DISTANCE; dx++) {
      for (var dz = -G.RENDER_DISTANCE; dz <= G.RENDER_DISTANCE; dz++) {
        if (dx * dx + dz * dz > G.RENDER_DISTANCE * G.RENDER_DISTANCE) continue;
        for (var cy = 0; cy < 4; cy++) {
          G.Terrain.generateChunk(pcx + dx, cy, pcz + dz);
        }
      }
    }
  }

  function generateTrees() {
    var pdx = Math.floor(playerPos.x / 16);
    var pdz = Math.floor(playerPos.z / 16);
    for (var dx = -G.RENDER_DISTANCE; dx <= G.RENDER_DISTANCE; dx++) {
      for (var dz = -G.RENDER_DISTANCE; dz <= G.RENDER_DISTANCE; dz++) {
        if (dx * dx + dz * dz > G.RENDER_DISTANCE * G.RENDER_DISTANCE) continue;
        var bx = (pdx + dx) * 16 + 8;
        var bz = (pdz + dz) * 16 + 8;
        if (Math.random() < 0.5) G.Terrain.generateTree(bx, bz);
        if (Math.random() < 0.3) G.Terrain.generateTree(bx + 3, bz + 4);
      }
    }
  }

  function buildAllMeshes() {
    for (var key in G.Chunks.cells) {
      var parts = key.split(',').map(Number);
      updateCellMesh(parts[0], parts[1], parts[2]);
    }
  }

  function updateCellMesh(cx, cy, cz) {
    var id = cx + ',' + cy + ',' + cz;
    var data = G.Chunks.generateCellGeometry(cx, cy, cz);
    if (data.positions.length === 0) {
      if (cellMeshes[id]) {
        scene.remove(cellMeshes[id]);
        cellMeshes[id].geometry.dispose();
        delete cellMeshes[id];
      }
      return;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
    geo.setIndex(data.indices);
    geo.computeBoundingSphere();

    var oldMesh = cellMeshes[id];
    var mesh = new THREE.Mesh(geo, material);
    mesh.position.set(cx * 16, cy * 16, cz * 16);
    cellMeshes[id] = mesh;
    scene.add(mesh);
    if (oldMesh) {
      scene.remove(oldMesh);
      oldMesh.geometry.dispose();
    }
  }

  function updateVoxelMesh(wx, wy, wz) {
    var updated = {};
    for (var i = 0; i < NEIGHBOR_OFFSETS.length; i++) {
      var o = NEIGHBOR_OFFSETS[i];
      var cx = Math.floor((wx + o[0]) / 16);
      var cy = Math.floor((wy + o[1]) / 16);
      var cz = Math.floor((wz + o[2]) / 16);
      var key = cx + ',' + cy + ',' + cz;
      if (!updated[key]) {
        updated[key] = true;
        updateCellMesh(cx, cy, cz);
      }
    }
  }

  function setupPointerLock() {
    var blocker = document.getElementById('blocker');
    blocker.addEventListener('click', function () {
      if (chat.isOpen) return;
      renderer.domElement.requestPointerLock();
      G.Sounds.resume();
    });
    document.addEventListener('pointerlockchange', function () {
      pointerLocked = !!document.pointerLockElement;
      if (chat.isOpen) { blocker.style.display = 'none'; return; }
      blocker.style.display = pointerLocked ? 'none' : 'flex';
    });
  }

  function getEyePosition() {
    return new THREE.Vector3(playerPos.x, playerPos.y + G.PLAYER_HEIGHT, playerPos.z);
  }

  function getTargetBlock() {
    var eye = getEyePosition();
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    var end = eye.clone().add(dir.clone().multiplyScalar(8));
    return intersectRay(eye, end);
  }

  function intersectRay(start, end) {
    var dx = end.x - start.x, dy = end.y - start.y, dz = end.z - start.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len === 0) return null;
    dx /= len; dy /= len; dz /= len;
    var t = 0;
    var ix = Math.floor(start.x), iy = Math.floor(start.y), iz = Math.floor(start.z);
    var stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
    var txDelta = Math.abs(1 / dx), tyDelta = Math.abs(1 / dy), tzDelta = Math.abs(1 / dz);
    var xDist = stepX > 0 ? (ix + 1 - start.x) : (start.x - ix);
    var yDist = stepY > 0 ? (iy + 1 - start.y) : (start.y - iy);
    var zDist = stepZ > 0 ? (iz + 1 - start.z) : (start.z - iz);
    var txMax = txDelta * xDist, tyMax = tyDelta * yDist, tzMax = tzDelta * zDist;
    var steppedIndex = -1;
    while (t <= 8) {
      var v = G.Chunks.getVoxel(ix, iy, iz);
      if (v && v !== G.BLOCK.AIR) {
        return {
          position: [start.x + t * dx, start.y + t * dy, start.z + t * dz],
          normal: [steppedIndex === 0 ? -stepX : 0, steppedIndex === 1 ? -stepY : 0, steppedIndex === 2 ? -stepZ : 0],
          voxel: v
        };
      }
      if (txMax < tyMax) {
        if (txMax < tzMax) { ix += stepX; t = txMax; txMax += txDelta; steppedIndex = 0; }
        else { iz += stepZ; t = tzMax; tzMax += tzDelta; steppedIndex = 2; }
      } else {
        if (tyMax < tzMax) { iy += stepY; t = tyMax; tyMax += tyDelta; steppedIndex = 1; }
        else { iz += stepZ; t = tzMax; tzMax += tzDelta; steppedIndex = 2; }
      }
    }
    return null;
  }

  function setupBlockInteraction() {
    var highlightGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005));
    var highlightMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.5 });
    var highlightMesh = new THREE.LineSegments(highlightGeo, highlightMat);
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    renderer.domElement.addEventListener('mousedown', function (e) {
      if (!pointerLocked || chat.isOpen || isDead) return;
      var target = getTargetBlock();
      if (!target) return;
      var n = target.normal;

      if (e.button === 0) {
        var px = Math.floor(target.position[0] - n[0] * 0.5);
        var py = Math.floor(target.position[1] - n[1] * 0.5);
        var pz = Math.floor(target.position[2] - n[2] * 0.5);
        var block = G.Chunks.getVoxel(px, py, pz);
        if (block && block !== G.BLOCK.AIR) {
          var colors = { 1: 0x5b8731, 2: 0x8b6914, 3: 0x888888, 4: 0xd4c68a, 5: 0x3366cc, 6: 0x6b4226, 7: 0x2d8a2d };
          G.Particles.emit(px + 0.5, py + 0.5, pz + 0.5, colors[block] || 0x888888, 8);
          G.Chunks.setVoxel(px, py, pz, G.BLOCK.AIR);
          updateVoxelMesh(px, py, pz);
          G.Sounds.playBreak();
        }
      } else if (e.button === 2) {
        var ppx = Math.floor(target.position[0] + n[0] * 0.5);
        var ppy = Math.floor(target.position[1] + n[1] * 0.5);
        var ppz = Math.floor(target.position[2] + n[2] * 0.5);
        var r = G.PLAYER_RADIUS;
        var bb = { x1: playerPos.x - r, x2: playerPos.x + r, y1: playerPos.y, y2: playerPos.y + G.PLAYER_HEIGHT, z1: playerPos.z - r, z2: playerPos.z + r };
        if (ppx + 1 > bb.x1 && ppx < bb.x2 && ppy + 1 > bb.y1 && ppy < bb.y2 && ppz + 1 > bb.z1 && ppz < bb.z2) return;
        if (G.Chunks.getVoxel(ppx, ppy, ppz) === G.BLOCK.AIR) {
          G.Chunks.setVoxel(ppx, ppy, ppz, G.BLOCK[blockTypes[selectedSlot]]);
          updateVoxelMesh(ppx, ppy, ppz);
          G.Sounds.playPlace();
        }
      }
    });
    renderer.domElement.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    window._updateHighlight = function () {
      var target = getTargetBlock();
      if (target) {
        var hx = Math.floor(target.position[0] + target.normal[0] * 0.5);
        var hy = Math.floor(target.position[1] + target.normal[1] * 0.5);
        var hz = Math.floor(target.position[2] + target.normal[2] * 0.5);
        highlightMesh.position.set(hx + 0.5, hy + 0.5, hz + 0.5);
        highlightMesh.visible = true;
      } else {
        highlightMesh.visible = false;
      }
    };
  }

  function setupScrollWheel() {
    document.addEventListener('wheel', function (e) {
      if (!pointerLocked) return;
      if (e.deltaY > 0) {
        selectedSlot = (selectedSlot + 1) % blockTypes.length;
      } else {
        selectedSlot = (selectedSlot - 1 + blockTypes.length) % blockTypes.length;
      }
      G.HUD.updateHotbar(selectedSlot);
    });

    document.addEventListener('keydown', function (e) {
      if (chat.isOpen) return;
      var num = parseInt(e.key, 10);
      if (num >= 1 && num <= blockTypes.length) {
        selectedSlot = num - 1;
        G.HUD.updateHotbar(selectedSlot);
      }
      if (e.code === 'KeyT') {
        e.preventDefault();
        chat.toggle();
        if (chat.isOpen) {
          document.exitPointerLock();
        } else {
          renderer.domElement.requestPointerLock();
        }
      }
    });
  }

  function collidesAt(x, y, z) {
    var r = G.PLAYER_RADIUS;
    var offsets = [
      [x - r, y, z - r], [x + r, y, z - r], [x - r, y, z + r], [x + r, y, z + r],
      [x - r, y + G.PLAYER_HEIGHT, z - r], [x + r, y + G.PLAYER_HEIGHT, z - r],
      [x - r, y + G.PLAYER_HEIGHT, z + r], [x + r, y + G.PLAYER_HEIGHT, z + r],
      [x - r, y + G.PLAYER_HEIGHT * 0.5, z - r], [x + r, y + G.PLAYER_HEIGHT * 0.5, z + r]
    ];
    for (var i = 0; i < offsets.length; i++) {
      var bx = Math.floor(offsets[i][0]), by = Math.floor(offsets[i][1]), bz = Math.floor(offsets[i][2]);
      var v = G.Chunks.getVoxel(bx, by, bz);
      if (v && v !== G.BLOCK.AIR && v !== G.BLOCK.WATER) return true;
    }
    return false;
  }

  function moveAxis(axis, delta) {
    var prev = playerPos[axis];
    playerPos[axis] += delta;
    if (collidesAt(playerPos.x, playerPos.y, playerPos.z)) {
      playerPos[axis] = prev;
      if (axis === 'y') {
        if (delta < 0) onGround = true;
        playerVel.y = 0;
      }
      return true;
    } else {
      if (axis === 'y') onGround = false;
    }
    return false;
  }

  function die(msg) {
    if (isDead) return;
    isDead = true;
    G.Sounds.playDeath();
    document.getElementById('death-msg').textContent = msg || 'You died';
    document.getElementById('death-screen').style.display = 'flex';
    document.exitPointerLock();
  }

  function respawn() {
    isDead = false;
    document.getElementById('death-screen').style.display = 'none';
    playerPos.set(8, G.Terrain.getTerrainHeight(8, 8) + 2, 8);
    playerVel.set(0, 0, 0);
    onGround = false;
    G.HUD.updateHealth(20);
    renderer.domElement.requestPointerLock();
  }

  function updatePlayer(dt) {
    if (isDead) return;
    dt = Math.min(dt, 0.05);
    var speed = G.Input.isDown('ShiftLeft') ? G.SPRINT_SPEED : G.PLAYER_SPEED;

    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
    var move = new THREE.Vector3();
    if (G.Input.isDown('KeyW')) move.add(forward);
    if (G.Input.isDown('KeyS')) move.sub(forward);
    if (G.Input.isDown('KeyA')) move.sub(right);
    if (G.Input.isDown('KeyD')) move.add(right);
    if (move.lengthSq() > 0) move.normalize();

    playerVel.x = move.x * speed;
    playerVel.z = move.z * speed;

    if (G.Input.isDown('Space') && onGround) {
      playerVel.y = G.JUMP_FORCE;
      onGround = false;
      G.Sounds.playJump();
    }
    playerVel.y += G.GRAVITY * dt;

    moveAxis('x', playerVel.x * dt);
    moveAxis('y', playerVel.y * dt);
    moveAxis('z', playerVel.z * dt);

    if (onGround && move.lengthSq() > 0) {
      stepTimer += dt;
      if (stepTimer > 0.4) {
        stepTimer = 0;
        G.Sounds.playStep('GRASS');
      }
    }

    if (playerPos.y < -20) {
      die('Fell into the void');
    }
  }

  function updateChunks() {
    var pcx = Math.floor(playerPos.x / 16);
    var pcz = Math.floor(playerPos.z / 16);
    if (pcx !== lastChunkX || pcz !== lastChunkZ) {
      lastChunkX = pcx;
      lastChunkZ = pcz;
      ensureChunksAround(pcx, pcz);
      generateTrees();
      for (var key in G.Chunks.cells) {
        var parts = key.split(',').map(Number);
        if (!cellMeshes[key]) updateCellMesh(parts[0], parts[1], parts[2]);
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();

    if (pointerLocked && !chat.isOpen && !isDead) {
      var md = G.Input.getMouseDelta();
      G.Input.consumeMouse();
      yaw -= md.x * 0.002;
      pitch -= md.y * 0.002;
      pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));

      updatePlayer(dt);
      updateChunks();

      var eye = getEyePosition();
      camera.position.copy(eye);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      if (window._updateHighlight) window._updateHighlight();
    }

    G.Sky.update(dt);
    G.Particles.update(dt);

    renderer.render(scene, camera);

    frameCount++;
    fpsTime += dt;
    if (fpsTime >= 1) {
      G.HUD.updateDebugInfo(frameCount, playerPos, '');
      frameCount = 0;
      fpsTime = 0;
    }
  }

  window.addEventListener('load', function () {
    try {
      init();
    } catch (e) {
      console.error('Game error:', e);
      document.body.innerHTML = '<div style="color:white;padding:40px;font-size:20px;font-family:monospace">Error: ' + e.message + '<br><br>Check console (F12) for details</div>';
    }
  });

  document.getElementById('respawn-btn').addEventListener('click', respawn);
})();
