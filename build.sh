#!/bin/sh

SOURCE_DIR="/Users/willjasen/GitHub/obsidian-binary-file-manager-plugin";
PLUGIN_DIR="/Users/willjasen/Syncthing/Obsidian/willjasen/.obsidian/plugins/obsidian-binary-file-manager-plugin";

# Go to the source directory and build it
cd "$SOURCE_DIR";
npm i;
npm run build;

# Copy built files into the plugin directory
cp $SOURCE_DIR/main.js $PLUGIN_DIR/main.js;
cp $SOURCE_DIR/manifest.json $PLUGIN_DIR/manifest.json;
cp $SOURCE_DIR/styles.css $PLUGIN_DIR/styles.css;
