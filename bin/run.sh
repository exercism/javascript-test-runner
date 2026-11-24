#!/bin/bash

# Synopsis:
# Automatically tests exercism's JS track solutions against corresponding test files.
# Takes two-three arguments and makes sure all the tests are run

# Arguments:
# $1: exercise slug
# $2: path to solution folder (with trailing slash)
# $3: path to output directory (with trailing slash) (defaults to $2)

# Output:
# Writes the tests output to the output directory

# Example:
# ./run.sh two-fer path/to/two-fer/solution/folder/
# ./run.sh two-fer path/to/two-fer/solution/folder/ path/to/output-directory/

if [[ $1 != http?(s)://* ]]; then
  if [ -z "$2" ] ; then
    echo "Requires at least 2 arguments:"
    echo "1: exercise slug"
    echo "2: path to solution folder (with trailing slash)"
    echo "3: (optional) path to output directory (with trailing slash) (defaults to \$2)"
    echo ""
    echo "Usage:"
    echo "  run.sh two-fer path/to/two-fer/solution/folder/ [path/to/output-directory/]"
    exit 1
  fi

  if [ -z "$3" ] ; then
    OUTPUT="$2"
  else
    OUTPUT="$3"
  fi

  INPUT="$2"
  SLUG="$1"
else
  # This block allows you to download a solution and run the tests on it. This
  # allows passing in any solution URL your locally installed exercism CLI has
  # access to:
  #
  # - published: https://exercism.io/tracks/typescript/exercises/clock/solutions/c3b826d95cb54441a8f354d7663e9e16
  # - private: https://exercism.io/solutions/c3b826d95cb54441a8f354d7663e9e16
  #
  uuid=$(basename $1)
  echo "🔗  Exercism remote UUID: $uuid"

  result=$(exercism download --uuid="${uuid}" | sed -n 1p) || exit $?
  echo $result

  SLUG=$(basename $result)
  TMP="./tmp/${SLUG}/${uuid}/"

  # Jest really doesn't like it when the input files are outside the CWD process
  # tree. Instead of trying to resolve that, the code here copies the downloaded
  # solution to a local temporary directory.
  #
  # This will fail if the cwd is not writable.
  #
  mkdir -p "$TMP"
  cp "$result" "$TMP" -r

  INPUT="$TMP$SLUG/"
  OUTPUT=$INPUT
fi

# Forces a trailing slash
INPUT="${INPUT//\\//}"
INPUT="${INPUT%/}/"

# Forces a trailing slash
OUTPUT="${OUTPUT//\\//}"
OUTPUT="${OUTPUT%/}/"

set -euo pipefail

ROOT="$(realpath $(dirname "$0")/..)"
REPORTER="$ROOT/dist/reporter.mjs"
SETUP="$ROOT/dist/setup.mjs"

echo " "
echo "╔═════════════════════════════════════════════════════════════╗"
echo "  🔧 Process input arguments for run                            "
echo "╚═════════════════════════════════════════════════════════════╝"
echo ""

echo "✔️  Using slug     : $SLUG"
echo "✔️  Using reporter : $REPORTER"
echo "✔️  Using srce-root: $INPUT"
echo "✔️  Using test-root: $OUTPUT"
echo "✔️  Using base-root: $ROOT"
echo "✔️  Using setup-env: $SETUP"

if test -f "$REPORTER"; then
  echo "✔️  reporter.mjs found, test runner was built"
else
  >&2 echo "❌ Expected reporter.mjs to exist."
  >&2 echo "❌ Did you forget to 'corepack pnpm build' first?"
  >&2 echo ""
  >&2 echo "👁️ The following files exist in the dist folder (build output):"
  >&2 echo $(ls $ROOT/dist)

  exit 1
fi

echo ""
echo "╔═════════════════════════════════════════════════════════════╗"
echo "  🔧 Preparing run                                              "
echo "╚═════════════════════════════════════════════════════════════╝"
echo ""

configuration_file="${INPUT}.meta/config.json"
local_configuration_file="${INPUT}.exercism/config.json"

# Prepare the test file(s)
mkdir -p "${OUTPUT}"

if [[ "${INPUT}" -ef "${OUTPUT}" ]]; then
  echo "Input matches output directory."
  echo "👁️  ${OUTPUT}"
  echo "✔️  Not copying input to output."
  echo ""
else
  echo "Input does not match output directory."
  echo "👁️  ${OUTPUT}"
  echo "✔️  Copying ${INPUT} to output."
  cp -r "${INPUT}/." "${OUTPUT}"
  echo ""
fi

echo "If the solution contains babel.config.js or package.json at    "
echo "the root, these configuration files will be used during the    "
echo "test-runner process which we do not want.                      "
echo "The test-runner will therefore temporarily rename these files."
echo ""

# Rename configuration files
if test -f "${OUTPUT}babel.config.js"; then
  echo "✔️  renaming babel.config.js in output so it can be replaced."
  mv "${OUTPUT}babel.config.js" "${OUTPUT}babel.config.js.💥.bak" || true
fi;

if test -f "${OUTPUT}package.json"; then
  echo "✔️  renaming package.json in output so it can be replaced."
  mv "${OUTPUT}package.json" "${OUTPUT}package.json.💥.bak" || true
fi;

if test -f "${OUTPUT}.npmrc"; then
  echo "✔️  renaming .npmrc in output so it can be replaced."
  mv "${OUTPUT}.npmrc" "${OUTPUT}.npmrc.💥.bak" || true
fi;

# Put together the path to the test results file
result_file="${OUTPUT}results.json"
echo "The results of this run will be written to 'results.json'."
echo "👁️  ${result_file}"
echo ""
echo "╔═════════════════════════════════════════════════════════════╗"
echo "  🔧 Preparing test suite file(s)                               "
echo "╚═════════════════════════════════════════════════════════════╝"
echo ""

if test -f $configuration_file; then
  echo "There is a configuration file in the expected .meta location "
  echo "which will now be used to determine which test files to prep."
  echo "👁️  ${configuration_file}"
  cat "${configuration_file}"
  echo ""

  cat $configuration_file | jq -c '.files.test[]' | xargs -L 1 "$ROOT/bin/prepare.sh" ${OUTPUT}

  # Every exercise has one test file.
  test_file=$(jq -r '.files.test[0]' "${configuration_file}")
else
  if test -f $local_configuration_file; then
    echo "There is a configuration file in the .exercism local       "
    echo "location which will now be used to determine which test    "
    echo "files to prep."
    echo "👁️  ${local_configuration_file}"
    cat "${local_configuration_file}"
    echo ""

    cat $local_configuration_file | jq -c '.files.test[]' | xargs -L 1 "$ROOT/bin/prepare.sh" ${OUTPUT}

    # Every exercise has one test file.
    test_file=$(jq -r '.files.test[0]' "${local_configuration_file}")
  else
    test_file="${SLUG}.spec.js"

    echo "⚠️  No configuration file found. The test-runner will now   "
    echo "   guess which test file(s) to prep based on the input."
    echo ""
    echo "👁️  ${OUTPUT}${test_file}"
    echo ""

    if test -f "${OUTPUT}${test_file}"; then
      "$ROOT/bin/prepare.sh" ${OUTPUT} ${test_file}
    else
      echo ""
      echo "If the solution previously contained configuration files,    "
      echo "they were disabled and now need to be restored."
      echo ""

      # Restore configuration files
      if test -f "${OUTPUT}babel.config.js.💥.bak"; then
        echo "✔️  restoring babel.config.js in output"
        mv "${OUTPUT}babel.config.js.💥.bak" "${OUTPUT}babel.config.js" || true
      fi;

      if test -f "${OUTPUT}package.json.💥.bak"; then
        echo "✔️  restoring package.json in output"
        if test -f "${OUTPUT}package.json"; then
          unlink "${OUTPUT}package.json"
        fi
        mv "${OUTPUT}package.json.💥.bak" "${OUTPUT}package.json" || true
      fi;

      if test -f "${OUTPUT}pnpm-lock.yaml.💥.bak"; then
        echo "✔️  restoring pnpm-lock.yaml in output"
        if test -f "${OUTPUT}pnpm-lock.yaml"; then
          unlink "${OUTPUT}pnpm-lock.yaml"
        fi
        mv "${OUTPUT}pnpm-lock.yaml.💥.bak" "${OUTPUT}pnpm-lock.yaml" || true
      fi;

      if test -f "${OUTPUT}.npmrc.💥.bak"; then
        echo "✔️  restoring .npmrc in output"
        if test -f "${OUTPUT}.npmrc"; then
          unlink "${OUTPUT}.npmrc"
        fi
        mv "${OUTPUT}.npmrc.💥.bak" "${OUTPUT}.npmrc" || true
      fi;

      result="The submitted code cannot be ran by the test-runner. There is no configuration file inside the .meta (or .exercism) directory, and the fallback test file '${test_file}' does not exist. Please fix these issues and resubmit."
      echo "{ \"version\": 1, \"status\": \"error\", \"message\": \"${result}\" }" > $result_file
      sed -Ei ':a;N;$!ba;s/\r{0,1}\n/\\n/g' $result_file

      echo "❌ could not run the test suite(s). A valid output exists:"
      echo "${result}"
      echo "---------------------------------------------------------------"

      # Test runner didn't fail!
      exit 0
    fi
  fi
fi

# Disable auto exit
set +e

echo ""
echo "╔═════════════════════════════════════════════════════════════╗"
echo "  ➤  Execution (tests: does the solution work?)               "
echo "╚═════════════════════════════════════════════════════════════╝"
echo ""

if test -f "${OUTPUT}${test_file}"; then
  echo "⚙️  node --test ${test_file}"
  echo ""

  # Run the tests with Node's built-in test runner. setup.mjs provides the
  # Jest API the tests use, and reporter.mjs writes results.json.
  #
  # --test-isolation=none runs the test file in this process, instead of
  # starting another one, and lets the reporter read the console messages.
  # --test-force-exit stops the process once the tests have finished, even
  # if the solution leaves a timer running.
  # --experimental-test-module-mocks enables jest.mock (see setup.mts).
  cd "${OUTPUT}" && TEST_FILE="${OUTPUT}${test_file}" RESULTS_FILE="${result_file}" node \
    --import "${SETUP}" \
    --experimental-test-module-mocks \
    --disable-warning=ExperimentalWarning \
    --test \
    --test-isolation=none \
    --test-force-exit \
    --test-reporter="${REPORTER}" \
    "${OUTPUT}${test_file}"

  # Convert exit(1) (the tests ran, but some failed) to exit(0)
  test_exit=$?

  if [ $test_exit -eq 1 ]; then
    echo "❌ not all tests (*.spec.js) passed."
  else
    echo "✅ all tests (*.spec.js) passed."
  fi;
else
  # The test file named in the configuration file is missing.
  # Version 3 output can't have an empty list of tests, so this uses the
  # version 1 format, which has no tests key.
  test_exit=0
  echo "{ \"version\": 1, \"status\": \"error\", \"message\": \"The submitted code was not subjected to any type or execution tests. At least one test was expected.\" }" > "${result_file}"
  echo "❌  no tests (*.spec.js) discovered."
fi;

echo ""
echo "If the solution previously contained configuration files,    "
echo "they were disabled and now need to be restored."
echo ""

# Restore configuration files
if test -f "${OUTPUT}babel.config.js.💥.bak"; then
  echo "✔️  restoring babel.config.js in output"
  mv "${OUTPUT}babel.config.js.💥.bak" "${OUTPUT}babel.config.js" || true
fi;

if test -f "${OUTPUT}package.json.💥.bak"; then
  echo "✔️  restoring package.json in output"
  if test -f "${OUTPUT}package.json"; then
    unlink "${OUTPUT}package.json"
  fi
  mv "${OUTPUT}package.json.💥.bak" "${OUTPUT}package.json" || true
fi;

if test -f "${OUTPUT}pnpm-lock.yaml.💥.bak"; then
  echo "✔️  restoring pnpm-lock.yaml in output"
  if test -f "${OUTPUT}pnpm-lock.yaml"; then
    unlink "${OUTPUT}pnpm-lock.yaml"
  fi
  mv "${OUTPUT}pnpm-lock.yaml.💥.bak" "${OUTPUT}pnpm-lock.yaml" || true
fi;

if test -f "${OUTPUT}.npmrc.💥.bak"; then
  echo "✔️  restoring .npmrc in output"
  if test -f "${OUTPUT}.npmrc"; then
    unlink "${OUTPUT}.npmrc"
  fi
  mv "${OUTPUT}.npmrc.💥.bak" "${OUTPUT}.npmrc" || true
fi;

echo ""
echo "---------------------------------------------------------------"
echo "The results of this run have been written to 'results.json'."
echo "👁️  ${result_file}"
echo ""

if [ $test_exit -eq 1 ]; then
  exit 0
else
  exit $test_exit
fi
