#!/bin/sh

# variables
SOURCE_DIR="/Users/willjasen/GitHub/obsidian-binary-file-manager-plugin";
PLUGIN_DIR="/Users/willjasen/Syncthing/Obsidian/willjasen/.obsidian/plugins/obsidian-binary-file-manager-plugin";
FILES=( "main.js" "manifest.json" "styles.css" );

# Go to the source directory and build it
cd $SOURCE_DIR;
npm i; npm run build;

# Copy built files into the plugin directory
for file in "${FILES[@]}"
do
  echo "Copying file: $file";
  cp $SOURCE_DIR/$file $PLUGIN_DIR/$file;
done
