#!/bin/sh

# This script builds the plugin and copies the output files into the associated plugin directory
# After the script is run, this plugin in Obisidian should disabled/enabled to refresh it

# variables
SOURCE_DIR="/Users/willjasen/GitHub/obsidian-binary-file-manager-plugin";
PLUGIN_DIR="/Users/willjasen/Obsidian/willjasen/.obsidian/plugins/obsidian-binary-file-manager-plugin";
FILES=( "main.js" "manifest.json" "styles.css" );

# Create the directory if needed
[ -d $PLUGIN_DIR ] || echo "Creating plugin directory at $PLUGIN_DIR"; mkdir $PLUGIN_DIR;

# Go to the source directory and build it
cd $SOURCE_DIR;
npm i; npm run build;

# Copy built files into the plugin directory
for file in "${FILES[@]}"
do
  echo "Copying file: $file --> $PLUGIN_DIR/$file";
  cp $SOURCE_DIR/$file $PLUGIN_DIR/$file;
done
echo "All files copied!";