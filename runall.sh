cd pi_rest_ledandsound/
screen -dm -S pi_rest_ledandsound nodemon app.js
cd ..

cd pi_mqtt_listener/
screen -dm -S pi_mqtt_listener nodemon app.js
cd ..

cd collector_mqtt/
screen -dm -S collector_mqtt nodemon app.js
cd ..
