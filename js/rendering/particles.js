(function () {
  "use strict";

  window.VoxelGame = window.VoxelGame || {};

  var POOL_SIZE = 200;
  var GRAVITY = -18;
  var PARTICLE_LIFETIME = 1.2;
  var PARTICLE_SIZE = 0.08;

  var particles = [];
  var pool = [];
  var scene = null;

  function createParticleObject() {
    var geo = new THREE.BoxGeometry(PARTICLE_SIZE, PARTICLE_SIZE, PARTICLE_SIZE);
    var mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    return {
      mesh: mesh,
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0,
      active: false
    };
  }

  function init(threeScene) {
    scene = threeScene;
    pool = [];
    particles = [];

    for (var i = 0; i < POOL_SIZE; i++) {
      var obj = createParticleObject();
      pool.push(obj);
    }
  }

  function getFromPool() {
    for (var i = 0; i < pool.length; i++) {
      if (!pool[i].active) {
        return pool[i];
      }
    }
    var obj = createParticleObject();
    pool.push(obj);
    return obj;
  }

  function emit(x, y, z, color, count) {
    count = count || 8;

    for (var i = 0; i < count; i++) {
      var p = getFromPool();
      p.active = true;
      p.life = PARTICLE_LIFETIME;
      p.maxLife = PARTICLE_LIFETIME;

      p.mesh.position.set(
        x + (Math.random() - 0.5) * 0.5,
        y + (Math.random() - 0.5) * 0.5,
        z + (Math.random() - 0.5) * 0.5
      );

      var spread = 3 + Math.random() * 3;
      p.velocity.set(
        (Math.random() - 0.5) * spread,
        Math.random() * spread * 0.8 + 2,
        (Math.random() - 0.5) * spread
      );

      p.mesh.material.color.set(color || 0x8B6914);
      p.mesh.material.transparent = true;
      p.mesh.material.opacity = 1;
      p.mesh.visible = true;
      p.mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      p.mesh.scale.set(1, 1, 1);

      scene.add(p.mesh);
      particles.push(p);
    }
  }

  function update(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      if (!p.active) {
        particles.splice(i, 1);
        continue;
      }

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        scene.remove(p.mesh);
        particles.splice(i, 1);
        continue;
      }

      p.velocity.y += GRAVITY * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.z += dt * 3;

      var lifeRatio = p.life / p.maxLife;
      p.mesh.material.opacity = lifeRatio;
      var scale = 0.5 + lifeRatio * 0.5;
      p.mesh.scale.set(scale, scale, scale);

      if (p.mesh.position.y < -1) {
        p.active = false;
        p.mesh.visible = false;
        scene.remove(p.mesh);
        particles.splice(i, 1);
      }
    }
  }

  function render() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.active) {
        p.mesh.visible = true;
      }
    }
  }

  function clear() {
    for (var i = 0; i < particles.length; i++) {
      particles[i].active = false;
      particles[i].mesh.visible = false;
      if (particles[i].mesh.parent) {
        scene.remove(particles[i].mesh);
      }
    }
    particles = [];
  }

  function getActiveCount() {
    return particles.length;
  }

  window.VoxelGame.Particles = {
    POOL_SIZE: POOL_SIZE,
    init: init,
    emit: emit,
    update: update,
    render: render,
    clear: clear,
    getActiveCount: getActiveCount
  };
})();
