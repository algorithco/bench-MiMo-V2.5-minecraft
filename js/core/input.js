(function () {
  window.VoxelGame = window.VoxelGame || {};

  var keys = {};
  var mouseButtons = {};
  var mouseDX = 0;
  var mouseDY = 0;
  var pointerLocked = false;

  function onKeyDown(e) {
    keys[e.code] = true;
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (pointerLocked) {
      mouseDX += e.movementX || 0;
      mouseDY += e.movementY || 0;
    }
  }

  function onMouseDown(e) {
    mouseButtons[e.button] = true;
  }

  function onMouseUp(e) {
    mouseButtons[e.button] = false;
  }

  function onPointerLockChange() {
    pointerLocked = document.pointerLockElement !== null;
  }

  VoxelGame.Input = {
    init: function (canvas) {
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('pointerlockchange', onPointerLockChange);

      canvas.addEventListener('click', function () {
        canvas.requestPointerLock();
      });
    },

    isDown: function (code) {
      return !!keys[code];
    },

    isMouseDown: function (button) {
      return !!mouseButtons[button];
    },

    getMouseDelta: function () {
      return { x: mouseDX, y: mouseDY };
    },

    consumeMouse: function () {
      mouseDX = 0;
      mouseDY = 0;
    },

    isPointerLocked: function () {
      return pointerLocked;
    }
  };
})();
