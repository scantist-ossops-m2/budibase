#!/bin/bash
set -e

if [[ -n $CPU_CORES ]]
then
  # Running in ci, where resources are limited
  echo "jest --coverage --maxWorkers=$CPU_CORES --bail $@"
  jest --coverage --maxWorkers=$CPU_CORES --bail $@
else
  # --maxWorkers performs better in development
  echo "jest --coverage --detectOpenHandles $@"
  jest --coverage --detectOpenHandles $@
fi