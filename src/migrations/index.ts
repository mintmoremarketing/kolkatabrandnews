import * as migration_20261014_102812_initial_archive from './20261014_102812_initial_archive';

export const migrations = [
  {
    up: migration_20261014_102812_initial_archive.up,
    down: migration_20261014_102812_initial_archive.down,
    name: '20261014_102812_initial_archive'
  },
];
