#!/bin/bash
cd /Users/yuriibakurov/proofound
echo "Starting seeding script..." > /tmp/seed-output.log
node scripts/seed-demo-users.mjs --yes >> /tmp/seed-output.log 2>&1
echo "Exit code: $?" >> /tmp/seed-output.log
echo "Done" >> /tmp/seed-output.log
cat /tmp/seed-output.log

