#!/bin/bash

mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123"}'
mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE"}'
sleep 2

mosquitto_pub -t 'buildchange' -m '{"state":"build_success","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123","buildTestSummary":"1 of 1462 failed","reasonSummary":"Code changes detected","failedTestCount":1}'
mosquitto_pub -t 'buildchange' -m '{"state":"build_fail","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE","buildTestSummary":"No tests found","reasonSummary":"Manual build"}'
sleep 1

mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123"}'
mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE"}'

mosquitto_pub -t 'buildchange' -m '{"state":"build_success","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE"}'
mosquitto_pub -t 'buildchange' -m '{"state":"build_fail","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123"}'

#mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"BRANCH-IR-1-123"}'
#mosquitto_pub -t 'buildchange' -m '{"state":"building","resultKey":"IRNG-CORE-GC-JOB1-197","chainName":"CORE"}'
