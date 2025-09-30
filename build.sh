#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Upgrade pip (we know this works for the first part)
python -m pip install --upgrade pip

# The 'python' command should now be available in the shell's PATH
# due to the previous steps. Run the rest of the commands sequentially.

echo "Installing requirements..."
python -m pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

echo "Build successful!"
