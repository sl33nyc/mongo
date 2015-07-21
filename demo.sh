#!/bin/bash

killall node
node demo/server.js &
sleep 2;
open -F "http://localhost:7076/"
sleep 2;

for i in `ls *.png | sort -r`; do
    python load_image.py -i $i -d test -c asdf -u localhost:12345
    sleep 2;
done

sleep 5;
killall node
