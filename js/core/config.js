(function () {
  window.VoxelGame = window.VoxelGame || {};

  VoxelGame.CHUNK_SIZE = 16;
  VoxelGame.WORLD_HEIGHT = 64;
  VoxelGame.RENDER_DISTANCE = 4;
  VoxelGame.BLOCK = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WATER: 5, WOOD: 6, LEAVES: 7 };
  VoxelGame.BLOCK_NAMES = ['Air', 'Grass', 'Dirt', 'Stone', 'Sand', 'Water', 'Wood', 'Leaves'];
  VoxelGame.GRAVITY = -20;
  VoxelGame.JUMP_FORCE = 8;
  VoxelGame.PLAYER_SPEED = 5;
  VoxelGame.SPRINT_SPEED = 8;
  VoxelGame.PLAYER_HEIGHT = 1.7;
  VoxelGame.PLAYER_RADIUS = 0.3;
})();
