#!/bin/bash
set -e

if [[ -n $CPU_CORES ]]
then
  echo "jest --coverage --max-workers=$CPU_CORES $@"
  jest --coverage --max-workers=$CPU_CORES $@
else
  echo "jest --coverage --detectOpenHandles $@"
  jest --coverage --detectOpenHandles $@
fi