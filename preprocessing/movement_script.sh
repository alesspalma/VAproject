#!/bin/bash
rm -f movement.csv
touch movement.csv
for logfile in data/Datasets/ActivityLogs/*; do
  echo Processing $logfile
  awk '(NR>1)' $logfile | sed -u 's/:00Z,POINT (/,/g' | tr -d ')' | tr ' ' ',' | cut -d ',' -f 1,2,3,4 | awk -F, '{$2=sprintf("%0.f",$2);}1' OFS=, | awk -F, '{$3=sprintf("%0.f",$3);}1' OFS=, | sort -t ',' -k 4n -k1 | awk -F, '{n=$2$3$4}l1!=n{if(p)print l0; print; p=0}l1==n{p=1}{l0=$0; l1=n}END{print}' >>movement.csv
  done
sort -t ',' -k 4n -k1 movement.csv | awk -F, '{n=$2$3$4}l1!=n{if(p)print l0; print; p=0}l1==n{p=1}{l0=$0; l1=n}END{print}' >movement2.csv