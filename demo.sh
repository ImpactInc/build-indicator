#!/bin/bash

# Set both banks to building
mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123"}'
sleep 3
mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE"}'
sleep 5

# Success for one bank, fail for other
mosquitto_pub -t 'buildchange' -m '{"state":"build_success","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123","buildTestSummary":"1 of 1462 failed","reasonSummary":"Code changes detected","failedTestCount":1}'
sleep 5
mosquitto_pub -t 'buildchange' -m '{"state":"build_fail","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE","buildTestSummary":"No tests found","reasonSummary":"Manual build"}'
sleep 5

# Building for both banks
mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123"}'
sleep 4
mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE"}'
sleep 4

# Success for both banks
mosquitto_pub -t 'buildchange' -m '{"state":"build_success","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE"}'
sleep 5
mosquitto_pub -t 'buildchange' -m '{"state":"build_success","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123"}'
