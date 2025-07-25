rm './helpers/Graph_Class.js'
rm './helpers/GraphManager.js'
tsc ./helpers/Graph_Class.ts
tsc ./helpers/GraphManager.ts

sudo python3 Deployment.py rebuild

#testing commit for machine noname