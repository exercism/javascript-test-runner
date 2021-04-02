#!/bin/bash

# prepare <directory> <file>

test_file="$1$2"
test_file=${test_file//$'\r'}


if test -f "$test_file"; then
  # Change xtest to test so all tests are run
  if [[ "$OSTYPE" == "darwin"* ]]; then # Mac OS X
    # BSD sed -i takes an extra parameter to specify the backup file extension
    sed -i 'tmp' 's/xtest(/test(/g' "${test_file}"
    sed -i 'tmp' 's/xit(/it(/g' "${test_file}"
    sed -i 'tmp' 's/xdescribe(/describe(/g' "${test_file}"
  else
    echo "Enabling tests in $test_file"

    sed -i 's/xtest(/test(/g' "${test_file}"
    sed -i 's/xit(/it(/g' "${test_file}"
    sed -i 's/xdescribe(/describe(/g' "${test_file}"
  fi
else
  echo "Can't find $test_file"
fi;