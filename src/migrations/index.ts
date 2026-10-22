import * as migration_20261014_102812_initial_archive from './20261014_102812_initial_archive';
import * as migration_20261022_123024_kbn_with_s3 from './20261022_123024_kbn_with_s3';

export const migrations = [
  {
    up: migration_20261014_102812_initial_archive.up,
    down: migration_20261014_102812_initial_archive.down,
    name: '20261014_102812_initial_archive',
  },
  {
    up: migration_20261022_123024_kbn_with_s3.up,
    down: migration_20261022_123024_kbn_with_s3.down,
    name: '20261022_123024_kbn_with_s3'
  },
];
