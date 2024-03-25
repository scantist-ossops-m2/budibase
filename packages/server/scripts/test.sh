#!/bin/bash
set -e

if [[ -n $CPU_CORES ]]
then
  export NODE_OPTIONS="--max-old-space-size=4096 --no-node-snapshot $NODE_OPTIONS"
  echo "jest --coverage --maxWorkers=$CPU_CORES --workerIdleMemoryLimit=2000MB --bail $@"
  jest --coverage --maxWorkers=$CPU_CORES --workerIdleMemoryLimit=2000MB --bail $@
else
  export NODE_OPTIONS="--no-node-snapshot $NODE_OPTIONS"
  echo "jest --coverage --detectOpenHandles $@"
  jest --coverage --detectOpenHandles $@
fi