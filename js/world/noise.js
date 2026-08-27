(function () {
  window.VoxelGame = window.VoxelGame || {};

  var F3 = 1.0 / 3.0;
  var G3 = 1.0 / 6.0;

  var grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
  ];

  function SimplexNoise(seed) {
    this.perm = new Array(512);
    this.permMod12 = new Array(512);

    var p = new Array(256);
    var i;
    for (i = 0; i < 256; i++) {
      p[i] = i;
    }

    seed = seed || Math.random() * 65536;
    var rng = this._seededRandom(seed);

    for (i = 255; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }

    for (i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  SimplexNoise.prototype._seededRandom = function (seed) {
    var s = seed;
    return function () {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  };

  SimplexNoise.prototype.noise3D = function (xin, yin, zin) {
    var perm = this.perm;
    var permMod12 = this.permMod12;

    var s = (xin + yin + zin) * F3;
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var k = Math.floor(zin + s);

    var t = (i + j + k) * G3;
    var X0 = i - t;
    var Y0 = j - t;
    var Z0 = k - t;
    var x0 = xin - X0;
    var y0 = yin - Y0;
    var z0 = zin - Z0;

    var i1, j1, k1;
    var i2, j2, k2;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
      }
    }

    var x1 = x0 - i1 + G3;
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;
    var x2 = x0 - i2 + 2.0 * G3;
    var y2 = y0 - j2 + 2.0 * G3;
    var z2 = z0 - k2 + 2.0 * G3;
    var x3 = x0 - 1.0 + 3.0 * G3;
    var y3 = y0 - 1.0 + 3.0 * G3;
    var z3 = z0 - 1.0 + 3.0 * G3;

    var ii = i & 255;
    var jj = j & 255;
    var kk = k & 255;
    var gi0 = permMod12[ii + perm[jj + perm[kk]]];
    var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
    var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
    var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];

    var n0, n1, n2, n3;

    var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) {
      n0 = 0.0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0 + grad3[gi0][2] * z0);
    }

    var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) {
      n1 = 0.0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1 + grad3[gi1][2] * z1);
    }

    var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) {
      n2 = 0.0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2 + grad3[gi2][2] * z2);
    }

    var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) {
      n3 = 0.0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * (grad3[gi3][0] * x3 + grad3[gi3][1] * y3 + grad3[gi3][2] * z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  };

  VoxelGame.SimplexNoise = SimplexNoise;
})();
