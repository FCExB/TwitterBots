#!/bin/bash


if (( $EUID != 0 )); then
    echo "Please run as root"
    exit
fi

echo Installin mongodb...
apt-get install mongodb

echo
echo Installing node...
apt-get install nodejs-legacy

echo
echo Installing npm...
apt-get install npm

echo
echo Installing forever...
npm install forever -g
