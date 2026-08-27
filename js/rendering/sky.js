(function () {
  "use strict";

  window.VoxelGame = window.VoxelGame || {};

  var DAY_DURATION = 300;
  var time = 0;
  var ambientLight = null;
  var directionalLight = null;
  var renderer = null;
  var scene = null;

  var SKY_COLORS = {
    noon: new THREE.Color(0x87ceeb),
    dawn: new THREE.Color(0xffa07a),
    dusk: new THREE.Color(0xff6347),
    night: new THREE.Color(0x0a0a2e)
  };

  var FOG_COLORS = {
    noon: new THREE.Color(0x87ceeb),
    dawn: new THREE.Color(0xffa07a),
    dusk: new THREE.Color(0xff6347),
    night: new THREE.Color(0x0a0a2e)
  };

  var LIGHT_COLORS = {
    noon: new THREE.Color(0xffffff),
    dawn: new THREE.Color(0xffcc88),
    dusk: new THREE.Color(0xff8866),
    night: new THREE.Color(0x334466)
  };

  var AMBIENT_INTENSITY = {
    noon: 0.5,
    dawn: 0.3,
    dusk: 0.3,
    night: 0.1
  };

  var DIRECTIONAL_INTENSITY = {
    noon: 1.0,
    dawn: 0.6,
    dusk: 0.6,
    night: 0.15
  };

  function init(threeScene, threeRenderer, dirLight, ambLight) {
    scene = threeScene;
    renderer = threeRenderer;
    directionalLight = dirLight;
    ambientLight = ambLight;
    time = 0.25;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function lerpColor(colorA, colorB, t) {
    var result = new THREE.Color();
    result.r = lerp(colorA.r, colorB.r, t);
    result.g = lerp(colorA.g, colorB.g, t);
    result.b = lerp(colorA.b, colorB.b, t);
    return result;
  }

  function getTimeOfDay(t) {
    t = t % 1;
    if (t < 0) t += 1;
    return t;
  }

  function update(dt) {
    time += dt / DAY_DURATION;
    time = getTimeOfDay(time);

    var phase, phaseTime, t;

    var skyColor, fogColor, lightColor;
    var ambientInt, dirInt;

    if (time < 0.25) {
      phase = "dawnToNoon";
      phaseTime = time / 0.25;
      t = smoothstep(phaseTime);
      skyColor = lerpColor(SKY_COLORS.dawn, SKY_COLORS.noon, t);
      fogColor = lerpColor(FOG_COLORS.dawn, FOG_COLORS.noon, t);
      lightColor = lerpColor(LIGHT_COLORS.dawn, LIGHT_COLORS.noon, t);
      ambientInt = lerp(AMBIENT_INTENSITY.dawn, AMBIENT_INTENSITY.noon, t);
      dirInt = lerp(DIRECTIONAL_INTENSITY.dawn, DIRECTIONAL_INTENSITY.noon, t);
    } else if (time < 0.5) {
      phase = "noonToDusk";
      phaseTime = (time - 0.25) / 0.25;
      t = smoothstep(phaseTime);
      skyColor = lerpColor(SKY_COLORS.noon, SKY_COLORS.dusk, t);
      fogColor = lerpColor(FOG_COLORS.noon, FOG_COLORS.dusk, t);
      lightColor = lerpColor(LIGHT_COLORS.noon, LIGHT_COLORS.dusk, t);
      ambientInt = lerp(AMBIENT_INTENSITY.noon, AMBIENT_INTENSITY.dusk, t);
      dirInt = lerp(DIRECTIONAL_INTENSITY.noon, DIRECTIONAL_INTENSITY.dusk, t);
    } else if (time < 0.75) {
      phase = "duskToNight";
      phaseTime = (time - 0.5) / 0.25;
      t = smoothstep(phaseTime);
      skyColor = lerpColor(SKY_COLORS.dusk, SKY_COLORS.night, t);
      fogColor = lerpColor(FOG_COLORS.dusk, FOG_COLORS.night, t);
      lightColor = lerpColor(LIGHT_COLORS.dusk, LIGHT_COLORS.night, t);
      ambientInt = lerp(AMBIENT_INTENSITY.dusk, AMBIENT_INTENSITY.night, t);
      dirInt = lerp(DIRECTIONAL_INTENSITY.dusk, DIRECTIONAL_INTENSITY.night, t);
    } else {
      phase = "nightToDawn";
      phaseTime = (time - 0.75) / 0.25;
      t = smoothstep(phaseTime);
      skyColor = lerpColor(SKY_COLORS.night, SKY_COLORS.dawn, t);
      fogColor = lerpColor(FOG_COLORS.night, FOG_COLORS.dawn, t);
      lightColor = lerpColor(LIGHT_COLORS.night, LIGHT_COLORS.dawn, t);
      ambientInt = lerp(AMBIENT_INTENSITY.night, AMBIENT_INTENSITY.dawn, t);
      dirInt = lerp(DIRECTIONAL_INTENSITY.night, DIRECTIONAL_INTENSITY.dawn, t);
    }

    scene.background = skyColor;

    if (scene.fog) {
      scene.fog.color.copy(fogColor);
    }

    if (ambientLight) {
      ambientLight.color.copy(lightColor);
      ambientLight.intensity = ambientInt;
    }

    if (directionalLight) {
      directionalLight.color.copy(lightColor);
      directionalLight.intensity = dirInt;

      var sunAngle = time * Math.PI * 2;
      directionalLight.position.set(
        Math.cos(sunAngle) * 100,
        Math.sin(sunAngle) * 100,
        50
      );
    }
  }

  function getTime() {
    return time;
  }

  function setTime(t) {
    time = getTimeOfDay(t);
  }

  function getDayProgress() {
    if (time < 0.25) return "dawn";
    if (time < 0.5) return "day";
    if (time < 0.75) return "dusk";
    return "night";
  }

  function getSunPosition() {
    var sunAngle = time * Math.PI * 2;
    return {
      x: Math.cos(sunAngle),
      y: Math.sin(sunAngle),
      z: 0.3
    };
  }

  window.VoxelGame.Sky = {
    DAY_DURATION: DAY_DURATION,
    init: init,
    update: update,
    getTime: getTime,
    setTime: setTime,
    getDayProgress: getDayProgress,
    getSunPosition: getSunPosition
  };
})();
