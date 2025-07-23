rm './helpers/Graph_Class.js'
rm './helpers/GraphManager.js'
tsc ./helpers/Graph_Class.ts
tsc ./helpers/GraphManager.ts
docker compose -f docker-composeR1.yaml build app1
docker compose -f docker-composeR2.yaml build app2
docker compose -f docker-composeR3.yaml build app3
#testing commit for machine noname